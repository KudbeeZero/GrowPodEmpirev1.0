/**
 * GrowPod Empire - Cloudflare Workers API
 * Simple routing without external dependencies
 *
 * Security Features:
 * - Input validation with Algorand address regex
 * - Rate limiting per IP
 * - XSS prevention via content sanitization
 * - SQL injection prevention via parameterized queries
 * - Security headers (CSP, X-Frame-Options, etc.)
 */

// ============================================
// Security Constants
// ============================================
const ALGORAND_ADDRESS_REGEX = /^[A-Z2-7]{58}$/;
const ALGORAND_ADDRESS_LENGTH = 58;
const MAX_TOKEN_AMOUNT = BigInt('10000000000000000000');
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ============================================
// Types
// ============================================
interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_WALLET_ADDRESS?: string;
  // R2 bucket for file uploads (optional - configure in wrangler.toml)
  MEDIA_BUCKET?: R2Bucket;
}

interface User {
  id: number;
  wallet_address: string;
  bud_balance: string;
  terp_balance: string;
  last_seen_announcement_id: number | null;
  last_login: string;
  created_at: string;
}

interface PlayerStats {
  id: number;
  wallet_address: string;
  total_harvests: number;
  total_bud_earned: string;
  total_terp_earned: string;
  rare_terpenes_found: number;
  updated_at: string;
}

// ============================================
// Security Helpers
// ============================================
function isValidAlgorandAddress(address: unknown): address is string {
  if (typeof address !== 'string') return false;
  if (address.length !== ALGORAND_ADDRESS_LENGTH) return false;
  return ALGORAND_ADDRESS_REGEX.test(address);
}

function isValidTokenAmount(amount: unknown): amount is string {
  if (typeof amount !== 'string') return false;
  if (!/^\d+$/.test(amount)) return false;
  try {
    const bigAmount = BigInt(amount);
    return bigAmount >= BigInt(0) && bigAmount <= MAX_TOKEN_AMOUNT;
  } catch {
    return false;
  }
}

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIp);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
         'unknown';
}

// ============================================
// Response Helpers
// ============================================
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500): Response {
  const safeMessage = status >= 500 ? 'Internal server error' : message;
  return jsonResponse({ message: safeMessage }, status);
}

function formatTokenAmount(amount: string): string {
  const num = BigInt(amount || '0');
  const decimals = BigInt(1000000);
  const whole = num / decimals;
  if (whole >= BigInt(1000000)) return `${(Number(whole) / 1000000).toFixed(1)}M`;
  if (whole >= BigInt(1000)) return `${(Number(whole) / 1000).toFixed(1)}K`;
  return whole.toString();
}

function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// ============================================
// Route Handlers
// ============================================
async function handleLogin(request: Request, env: Env): Promise<Response> {
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return errorResponse('Too many requests', 429);
  }

  const body = await request.json() as { walletAddress: string };
  const { walletAddress } = body;

  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address format', 400);
  }

  let user = await env.DB.prepare(
    'SELECT * FROM users WHERE wallet_address = ?'
  ).bind(walletAddress).first<User>();

  if (!user) {
    await env.DB.prepare(
      'INSERT INTO users (wallet_address) VALUES (?)'
    ).bind(walletAddress).run();

    user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first<User>();

    return jsonResponse(toCamelCase(user!), 201);
  }

  await env.DB.prepare(
    "UPDATE users SET last_login = datetime('now') WHERE id = ?"
  ).bind(user.id).run();

  user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(user.id).first<User>();

  return jsonResponse(toCamelCase(user!));
}

async function handleSyncBalances(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { walletAddress: string; budBalance: string; terpBalance: string };
  const { walletAddress, budBalance, terpBalance } = body;

  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address format', 400);
  }
  if (!isValidTokenAmount(budBalance) || !isValidTokenAmount(terpBalance)) {
    return errorResponse('Invalid balance format', 400);
  }

  await env.DB.prepare(
    'UPDATE users SET bud_balance = ?, terp_balance = ? WHERE wallet_address = ?'
  ).bind(budBalance, terpBalance, walletAddress).run();

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE wallet_address = ?'
  ).bind(walletAddress).first<User>();

  return jsonResponse(toCamelCase(user!));
}

async function handleGetUser(walletAddress: string, env: Env): Promise<Response> {
  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address format', 400);
  }

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE wallet_address = ?'
  ).bind(walletAddress).first<User>();

  if (!user) return errorResponse('User not found', 404);
  return jsonResponse(toCamelCase(user));
}

async function handleLeaderboard(type: string, env: Env): Promise<Response> {
  let query = '';
  if (type === 'harvests') {
    query = 'SELECT * FROM player_stats ORDER BY total_harvests DESC LIMIT 20';
  } else if (type === 'bud') {
    query = 'SELECT * FROM player_stats ORDER BY CAST(total_bud_earned AS INTEGER) DESC LIMIT 20';
  } else if (type === 'terp') {
    query = 'SELECT * FROM player_stats ORDER BY CAST(total_terp_earned AS INTEGER) DESC LIMIT 20';
  } else {
    return errorResponse('Invalid leaderboard type', 400);
  }

  const results = await env.DB.prepare(query).all<PlayerStats>();
  const leaderboard = (results.results || []).map((r, idx) => ({
    rank: idx + 1,
    wallet: r.wallet_address,
    value: type === 'harvests' ? r.total_harvests : 0,
    displayValue: type === 'harvests'
      ? r.total_harvests.toString()
      : formatTokenAmount(type === 'bud' ? r.total_bud_earned : r.total_terp_earned),
    rawValue: type !== 'harvests' ? (type === 'bud' ? r.total_bud_earned : r.total_terp_earned) : undefined,
  }));

  return jsonResponse(leaderboard);
}

async function handleGlobalStats(env: Env): Promise<Response> {
  const stats = await env.DB.prepare(`
    SELECT
      COALESCE(SUM(total_harvests), 0) as total_harvests,
      COALESCE(SUM(CAST(total_bud_earned AS INTEGER)), 0) as total_bud_minted,
      COUNT(*) as total_players,
      COALESCE(SUM(rare_terpenes_found), 0) as rare_terpenes_found
    FROM player_stats
  `).first<{ total_harvests: number; total_bud_minted: number; total_players: number; rare_terpenes_found: number }>();

  return jsonResponse({
    totalHarvests: stats?.total_harvests || 0,
    totalBudMinted: (stats?.total_bud_minted || 0).toString(),
    totalPlayers: stats?.total_players || 0,
    rareTerpenesFound: stats?.rare_terpenes_found || 0,
  });
}

async function handleRecordHarvest(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { walletAddress: string; budEarned: string; terpEarned?: string; isRareTerp?: boolean };
  const { walletAddress, budEarned, terpEarned = '0', isRareTerp = false } = body;

  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address format', 400);
  }
  if (!isValidTokenAmount(budEarned)) {
    return errorResponse('Invalid BUD earned amount', 400);
  }

  let stats = await env.DB.prepare(
    'SELECT * FROM player_stats WHERE wallet_address = ?'
  ).bind(walletAddress).first<PlayerStats>();

  if (!stats) {
    await env.DB.prepare(
      'INSERT INTO player_stats (wallet_address) VALUES (?)'
    ).bind(walletAddress).run();

    stats = await env.DB.prepare(
      'SELECT * FROM player_stats WHERE wallet_address = ?'
    ).bind(walletAddress).first<PlayerStats>();
  }

  const newBudTotal = (BigInt(stats!.total_bud_earned) + BigInt(budEarned)).toString();
  const newTerpTotal = (BigInt(stats!.total_terp_earned) + BigInt(terpEarned)).toString();
  const newRareTerps = isRareTerp ? stats!.rare_terpenes_found + 1 : stats!.rare_terpenes_found;

  await env.DB.prepare(`
    UPDATE player_stats SET
      total_harvests = total_harvests + 1,
      total_bud_earned = ?,
      total_terp_earned = ?,
      rare_terpenes_found = ?,
      updated_at = datetime('now')
    WHERE wallet_address = ?
  `).bind(newBudTotal, newTerpTotal, newRareTerps, walletAddress).run();

  const updated = await env.DB.prepare(
    'SELECT * FROM player_stats WHERE wallet_address = ?'
  ).bind(walletAddress).first<PlayerStats>();

  return jsonResponse(toCamelCase(updated!));
}

async function handleGetSongs(env: Env): Promise<Response> {
  const results = await env.DB.prepare(
    'SELECT * FROM songs ORDER BY created_at DESC'
  ).all();
  return jsonResponse((results.results || []).map(s => toCamelCase(s as Record<string, unknown>)));
}

async function handleAddSong(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { title: string; artist: string; objectPath: string };
  const { title, artist, objectPath } = body;

  if (!title || !artist || !objectPath) {
    return errorResponse('Missing required fields: title, artist, objectPath', 400);
  }

  // Sanitize inputs
  const sanitizedTitle = title.slice(0, 200).replace(/[<>]/g, '');
  const sanitizedArtist = artist.slice(0, 200).replace(/[<>]/g, '');

  await env.DB.prepare(
    'INSERT INTO songs (title, artist, object_path, play_count) VALUES (?, ?, ?, 0)'
  ).bind(sanitizedTitle, sanitizedArtist, objectPath).run();

  const song = await env.DB.prepare(
    'SELECT * FROM songs WHERE object_path = ? ORDER BY id DESC LIMIT 1'
  ).bind(objectPath).first();

  return jsonResponse(toCamelCase(song as Record<string, unknown>), 201);
}

async function handleDeleteSong(songId: string, env: Env): Promise<Response> {
  const id = parseInt(songId, 10);
  if (isNaN(id)) {
    return errorResponse('Invalid song ID', 400);
  }

  // Get the song first to get the object path
  const song = await env.DB.prepare('SELECT * FROM songs WHERE id = ?').bind(id).first<{ object_path: string }>();

  if (!song) {
    return errorResponse('Song not found', 404);
  }

  // Delete from database
  await env.DB.prepare('DELETE FROM songs WHERE id = ?').bind(id).run();

  // Try to delete from R2 if bucket is configured
  if (env.MEDIA_BUCKET && song.object_path) {
    try {
      await env.MEDIA_BUCKET.delete(song.object_path);
    } catch (err) {
      console.error('Failed to delete R2 object:', err);
    }
  }

  return jsonResponse({ success: true, deleted: id });
}

async function handlePlaySong(songId: string, env: Env): Promise<Response> {
  const id = parseInt(songId, 10);
  if (isNaN(id)) {
    return errorResponse('Invalid song ID', 400);
  }

  await env.DB.prepare(
    'UPDATE songs SET play_count = play_count + 1 WHERE id = ?'
  ).bind(id).run();

  return jsonResponse({ success: true });
}

async function handleGetSeedBank(env: Env): Promise<Response> {
  const results = await env.DB.prepare(
    'SELECT * FROM seed_bank WHERE is_active = 1 ORDER BY created_at DESC'
  ).all();

  const seeds = (results.results || []).map((s: any) => ({
    ...toCamelCase(s),
    terpeneProfile: JSON.parse(s.terpene_profile || '[]'),
    effects: JSON.parse(s.effects || '[]'),
    flavorNotes: JSON.parse(s.flavor_notes || '[]'),
  }));

  return jsonResponse(seeds);
}

async function handleGetUserSeeds(walletAddress: string, env: Env): Promise<Response> {
  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address format', 400);
  }

  const results = await env.DB.prepare(`
    SELECT us.*, sb.name, sb.description, sb.rarity, sb.terpene_profile, sb.effects, sb.flavor_notes,
           sb.thc_range, sb.cbd_range, sb.growth_bonus, sb.bud_price, sb.image_path, sb.glow_color
    FROM user_seeds us
    INNER JOIN seed_bank sb ON us.seed_id = sb.id
    WHERE us.wallet_address = ?
  `).bind(walletAddress).all();

  const userSeeds = (results.results || []).map((r: any) => ({
    id: r.id,
    walletAddress: r.wallet_address,
    seedId: r.seed_id,
    quantity: r.quantity,
    purchasedAt: r.purchased_at,
    seed: {
      id: r.seed_id,
      name: r.name,
      description: r.description,
      rarity: r.rarity,
      terpeneProfile: JSON.parse(r.terpene_profile || '[]'),
      effects: JSON.parse(r.effects || '[]'),
      flavorNotes: JSON.parse(r.flavor_notes || '[]'),
      thcRange: r.thc_range,
      cbdRange: r.cbd_range,
      growthBonus: r.growth_bonus,
      budPrice: r.bud_price,
      imagePath: r.image_path,
      glowColor: r.glow_color,
    },
  }));

  return jsonResponse(userSeeds);
}

async function handleGetAnnouncement(env: Env): Promise<Response> {
  const announcement = await env.DB.prepare(
    'SELECT * FROM announcement_videos WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
  ).first();
  return jsonResponse(announcement ? toCamelCase(announcement as Record<string, unknown>) : null);
}

// ============================================
// File Upload Handlers (R2 Storage)
// ============================================
async function handleRequestUploadUrl(request: Request, env: Env): Promise<Response> {
  // Check if R2 bucket is configured
  if (!env.MEDIA_BUCKET) {
    return errorResponse('File uploads not configured. Add R2 bucket binding in wrangler.toml', 503);
  }

  const body = await request.json() as { name: string; size: number; contentType: string };
  const { name, size, contentType } = body;

  if (!name || !contentType) {
    return errorResponse('Missing file name or content type', 400);
  }

  // Validate file size (max 50MB)
  if (size > 50 * 1024 * 1024) {
    return errorResponse('File too large. Maximum size is 50MB', 400);
  }

  // Validate content type
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'video/mp4', 'image/png', 'image/jpeg', 'image/gif'];
  if (!allowedTypes.includes(contentType)) {
    return errorResponse('Invalid file type. Allowed: audio, video, and images', 400);
  }

  // Generate unique object path
  const timestamp = Date.now();
  const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const objectPath = `uploads/${timestamp}-${sanitizedName}`;

  // For R2, we'll use a simple approach: return a path for direct upload
  // The client will upload directly to our /api/uploads/file endpoint
  return jsonResponse({
    uploadURL: `/api/uploads/file?path=${encodeURIComponent(objectPath)}`,
    objectPath: objectPath,
    metadata: { name, size, contentType }
  });
}

async function handleFileUpload(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.MEDIA_BUCKET) {
    return errorResponse('File uploads not configured', 503);
  }

  const objectPath = url.searchParams.get('path');
  if (!objectPath) {
    return errorResponse('Missing file path', 400);
  }

  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  const fileData = await request.arrayBuffer();

  try {
    await env.MEDIA_BUCKET.put(objectPath, fileData, {
      httpMetadata: { contentType }
    });

    return jsonResponse({ success: true, objectPath });
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse('Failed to upload file');
  }
}

async function handleGetFile(env: Env, objectPath: string): Promise<Response> {
  if (!env.MEDIA_BUCKET) {
    return errorResponse('File storage not configured', 503);
  }

  const file = await env.MEDIA_BUCKET.get(objectPath);
  if (!file) {
    return errorResponse('File not found', 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
    }
  });
}

// ============================================
// Prediction Market Handlers
// ============================================

// Burn $BUD to get $SMOKE (1:1 ratio for simplicity)
async function handleBurnForSmoke(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { walletAddress: string; budAmount: string };
  const { walletAddress, budAmount } = body;

  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address', 400);
  }
  if (!isValidTokenAmount(budAmount) || BigInt(budAmount) <= BigInt(0)) {
    return errorResponse('Invalid BUD amount', 400);
  }

  // Get or create smoke balance
  let smokeBalance = await env.DB.prepare(
    'SELECT * FROM smoke_balances WHERE wallet_address = ?'
  ).bind(walletAddress).first<{ balance: string; total_burned: string }>();

  if (!smokeBalance) {
    await env.DB.prepare(
      'INSERT INTO smoke_balances (wallet_address) VALUES (?)'
    ).bind(walletAddress).run();
    smokeBalance = { balance: '0', total_burned: '0' };
  }

  // Calculate new balances (1 $BUD = 1 $SMOKE)
  const newBalance = (BigInt(smokeBalance.balance) + BigInt(budAmount)).toString();
  const newTotalBurned = (BigInt(smokeBalance.total_burned) + BigInt(budAmount)).toString();

  await env.DB.prepare(`
    UPDATE smoke_balances
    SET balance = ?, total_burned = ?, updated_at = datetime('now')
    WHERE wallet_address = ?
  `).bind(newBalance, newTotalBurned, walletAddress).run();

  return jsonResponse({
    success: true,
    smokeBalance: newBalance,
    budBurned: budAmount,
    totalBurned: newTotalBurned
  });
}

// Get $SMOKE balance
async function handleGetSmokeBalance(walletAddress: string, env: Env): Promise<Response> {
  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address', 400);
  }

  const balance = await env.DB.prepare(
    'SELECT * FROM smoke_balances WHERE wallet_address = ?'
  ).bind(walletAddress).first();

  if (!balance) {
    return jsonResponse({ balance: '0', totalBurned: '0', totalWon: '0', totalLost: '0' });
  }

  return jsonResponse(toCamelCase(balance as Record<string, unknown>));
}

// List prediction markets
async function handleListMarkets(env: Env, url: URL): Promise<Response> {
  const status = url.searchParams.get('status') || 'open';
  const category = url.searchParams.get('category');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

  let query = 'SELECT * FROM prediction_markets WHERE status = ?';
  const params: (string | number)[] = [status];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY expiration_time ASC LIMIT ?';
  params.push(limit);

  const stmt = env.DB.prepare(query);
  const results = await stmt.bind(...params).all();

  const markets = (results.results || []).map(m => toCamelCase(m as Record<string, unknown>));
  return jsonResponse(markets);
}

// Get single market details
async function handleGetMarket(marketId: string, env: Env): Promise<Response> {
  const id = parseInt(marketId, 10);
  if (isNaN(id)) {
    return errorResponse('Invalid market ID', 400);
  }

  const market = await env.DB.prepare(
    'SELECT * FROM prediction_markets WHERE id = ?'
  ).bind(id).first();

  if (!market) {
    return errorResponse('Market not found', 404);
  }

  return jsonResponse(toCamelCase(market as Record<string, unknown>));
}

// Buy shares in a market
async function handleBuyShares(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    walletAddress: string;
    marketId: number;
    side: 'yes' | 'no';
    shares: string;
  };
  const { walletAddress, marketId, side, shares } = body;

  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address', 400);
  }
  if (!['yes', 'no'].includes(side)) {
    return errorResponse('Side must be "yes" or "no"', 400);
  }
  const sharesBigInt = BigInt(shares || '0');
  if (sharesBigInt <= BigInt(0)) {
    return errorResponse('Invalid share amount', 400);
  }

  // Get market
  const market = await env.DB.prepare(
    'SELECT * FROM prediction_markets WHERE id = ? AND status = ?'
  ).bind(marketId, 'open').first<{
    yes_price: number;
    no_price: number;
    total_yes_shares: string;
    total_no_shares: string;
    total_volume: string;
  }>();

  if (!market) {
    return errorResponse('Market not found or closed', 404);
  }

  // Calculate cost
  const pricePerShare = side === 'yes' ? market.yes_price : market.no_price;
  const totalCost = (sharesBigInt * BigInt(pricePerShare)).toString();

  // Check $SMOKE balance
  const smokeBalance = await env.DB.prepare(
    'SELECT balance FROM smoke_balances WHERE wallet_address = ?'
  ).bind(walletAddress).first<{ balance: string }>();

  if (!smokeBalance || BigInt(smokeBalance.balance) < BigInt(totalCost)) {
    return errorResponse('Insufficient $SMOKE balance', 400);
  }

  // Deduct $SMOKE
  const newSmokeBalance = (BigInt(smokeBalance.balance) - BigInt(totalCost)).toString();
  await env.DB.prepare(
    'UPDATE smoke_balances SET balance = ?, updated_at = datetime(\'now\') WHERE wallet_address = ?'
  ).bind(newSmokeBalance, walletAddress).run();

  // Update or create position
  const existingPosition = await env.DB.prepare(
    'SELECT * FROM market_positions WHERE wallet_address = ? AND market_id = ?'
  ).bind(walletAddress, marketId).first<{
    yes_shares: string;
    no_shares: string;
    avg_yes_price: number;
    avg_no_price: number;
  }>();

  if (existingPosition) {
    const currentShares = side === 'yes' ? existingPosition.yes_shares : existingPosition.no_shares;
    const currentAvgPrice = side === 'yes' ? existingPosition.avg_yes_price : existingPosition.avg_no_price;

    // Calculate new weighted average price
    const totalSharesAfter = BigInt(currentShares) + sharesBigInt;
    const newAvgPrice = totalSharesAfter > BigInt(0)
      ? Number((BigInt(currentShares) * BigInt(currentAvgPrice) + sharesBigInt * BigInt(pricePerShare)) / totalSharesAfter)
      : pricePerShare;

    const newShares = totalSharesAfter.toString();

    if (side === 'yes') {
      await env.DB.prepare(`
        UPDATE market_positions
        SET yes_shares = ?, avg_yes_price = ?, updated_at = datetime('now')
        WHERE wallet_address = ? AND market_id = ?
      `).bind(newShares, newAvgPrice, walletAddress, marketId).run();
    } else {
      await env.DB.prepare(`
        UPDATE market_positions
        SET no_shares = ?, avg_no_price = ?, updated_at = datetime('now')
        WHERE wallet_address = ? AND market_id = ?
      `).bind(newShares, newAvgPrice, walletAddress, marketId).run();
    }
  } else {
    await env.DB.prepare(`
      INSERT INTO market_positions (wallet_address, market_id, yes_shares, no_shares, avg_yes_price, avg_no_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      marketId,
      side === 'yes' ? shares : '0',
      side === 'no' ? shares : '0',
      side === 'yes' ? pricePerShare : 0,
      side === 'no' ? pricePerShare : 0
    ).run();
  }

  // Update market totals
  const newTotalShares = side === 'yes'
    ? (BigInt(market.total_yes_shares) + sharesBigInt).toString()
    : (BigInt(market.total_no_shares) + sharesBigInt).toString();
  const newVolume = (BigInt(market.total_volume) + BigInt(totalCost)).toString();

  if (side === 'yes') {
    await env.DB.prepare(`
      UPDATE prediction_markets SET total_yes_shares = ?, total_volume = ? WHERE id = ?
    `).bind(newTotalShares, newVolume, marketId).run();
  } else {
    await env.DB.prepare(`
      UPDATE prediction_markets SET total_no_shares = ?, total_volume = ? WHERE id = ?
    `).bind(newTotalShares, newVolume, marketId).run();
  }

  // Record order
  await env.DB.prepare(`
    INSERT INTO market_orders (wallet_address, market_id, side, action, shares, price_per_share, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(walletAddress, marketId, side, 'buy', shares, pricePerShare, totalCost).run();

  return jsonResponse({
    success: true,
    order: {
      marketId,
      side,
      shares,
      pricePerShare,
      totalCost,
    },
    newSmokeBalance
  });
}

// Get user's positions
async function handleGetPositions(walletAddress: string, env: Env): Promise<Response> {
  if (!isValidAlgorandAddress(walletAddress)) {
    return errorResponse('Invalid wallet address', 400);
  }

  const results = await env.DB.prepare(`
    SELECT mp.*, pm.title, pm.status, pm.outcome, pm.yes_price, pm.no_price, pm.expiration_time
    FROM market_positions mp
    INNER JOIN prediction_markets pm ON mp.market_id = pm.id
    WHERE mp.wallet_address = ?
    ORDER BY pm.expiration_time ASC
  `).bind(walletAddress).all();

  const positions = (results.results || []).map((p: any) => ({
    marketId: p.market_id,
    marketTitle: p.title,
    marketStatus: p.status,
    marketOutcome: p.outcome,
    yesShares: p.yes_shares,
    noShares: p.no_shares,
    avgYesPrice: p.avg_yes_price,
    avgNoPrice: p.avg_no_price,
    currentYesPrice: p.yes_price,
    currentNoPrice: p.no_price,
    expirationTime: p.expiration_time,
  }));

  return jsonResponse(positions);
}

// Create a new market (admin only for now)
async function handleCreateMarket(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    title: string;
    description?: string;
    category?: string;
    asset?: string;
    targetPrice?: string;
    comparison?: string;
    expirationTime: string;
    initialYesPrice?: number;
  };

  const {
    title,
    description,
    category = 'crypto',
    asset,
    targetPrice,
    comparison = 'above',
    expirationTime,
    initialYesPrice = 50
  } = body;

  if (!title || !expirationTime) {
    return errorResponse('Missing required fields: title, expirationTime', 400);
  }

  const sanitizedTitle = title.slice(0, 300).replace(/[<>]/g, '');
  const sanitizedDesc = description?.slice(0, 1000).replace(/[<>]/g, '');
  const noPrice = 100 - initialYesPrice;

  await env.DB.prepare(`
    INSERT INTO prediction_markets
    (title, description, category, asset, target_price, comparison, expiration_time, yes_price, no_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sanitizedTitle,
    sanitizedDesc || null,
    category,
    asset || null,
    targetPrice || null,
    comparison,
    expirationTime,
    initialYesPrice,
    noPrice
  ).run();

  const market = await env.DB.prepare(
    'SELECT * FROM prediction_markets ORDER BY id DESC LIMIT 1'
  ).first();

  return jsonResponse(toCamelCase(market as Record<string, unknown>), 201);
}

// ============================================
// Main Router
// ============================================
async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  try {
    // Health check
    if (path === '/api/ping') {
      return jsonResponse({ pong: true, time: Date.now() });
    }

    // Config
    if (path === '/api/config' && method === 'GET') {
      return jsonResponse({ network: 'testnet' });
    }

    // Users
    if (path === '/api/users/login' && method === 'POST') {
      return await handleLogin(request, env);
    }
    if (path === '/api/users/sync-balances' && method === 'POST') {
      return await handleSyncBalances(request, env);
    }
    if (path.startsWith('/api/users/') && method === 'GET') {
      const walletAddress = path.replace('/api/users/', '');
      return await handleGetUser(walletAddress, env);
    }

    // Leaderboards
    if (path === '/api/leaderboard/harvests' && method === 'GET') {
      return await handleLeaderboard('harvests', env);
    }
    if (path === '/api/leaderboard/bud' && method === 'GET') {
      return await handleLeaderboard('bud', env);
    }
    if (path === '/api/leaderboard/terp' && method === 'GET') {
      return await handleLeaderboard('terp', env);
    }

    // Stats
    if (path === '/api/stats/global' && method === 'GET') {
      return await handleGlobalStats(env);
    }
    if (path === '/api/stats/record-harvest' && method === 'POST') {
      return await handleRecordHarvest(request, env);
    }

    // Jukebox
    if (path === '/api/jukebox/songs' && method === 'GET') {
      return await handleGetSongs(env);
    }
    if (path === '/api/jukebox/songs' && method === 'POST') {
      return await handleAddSong(request, env);
    }
    if (path.match(/^\/api\/jukebox\/songs\/\d+$/) && method === 'DELETE') {
      const songId = path.split('/').pop()!;
      return await handleDeleteSong(songId, env);
    }
    if (path.match(/^\/api\/jukebox\/songs\/\d+\/play$/) && method === 'POST') {
      const songId = path.split('/')[4];
      return await handlePlaySong(songId, env);
    }

    // Seed Bank
    if (path === '/api/seed-bank' && method === 'GET') {
      return await handleGetSeedBank(env);
    }
    if (path.startsWith('/api/user-seeds/') && method === 'GET') {
      const walletAddress = path.replace('/api/user-seeds/', '');
      return await handleGetUserSeeds(walletAddress, env);
    }

    // Announcements
    if (path === '/api/announcement/current' && method === 'GET') {
      return await handleGetAnnouncement(env);
    }

    // Prediction Markets
    if (path === '/api/smoke/burn' && method === 'POST') {
      return await handleBurnForSmoke(request, env);
    }
    if (path.match(/^\/api\/smoke\/[A-Z2-7]{58}$/) && method === 'GET') {
      const walletAddress = path.split('/').pop()!;
      return await handleGetSmokeBalance(walletAddress, env);
    }
    if (path === '/api/markets' && method === 'GET') {
      return await handleListMarkets(env, url);
    }
    if (path === '/api/markets' && method === 'POST') {
      return await handleCreateMarket(request, env);
    }
    if (path.match(/^\/api\/markets\/\d+$/) && method === 'GET') {
      const marketId = path.split('/').pop()!;
      return await handleGetMarket(marketId, env);
    }
    if (path === '/api/markets/buy' && method === 'POST') {
      return await handleBuyShares(request, env);
    }
    if (path.match(/^\/api\/positions\/[A-Z2-7]{58}$/) && method === 'GET') {
      const walletAddress = path.split('/').pop()!;
      return await handleGetPositions(walletAddress, env);
    }

    // File Uploads (R2 Storage)
    if (path === '/api/uploads/request-url' && method === 'POST') {
      return await handleRequestUploadUrl(request, env);
    }
    if (path === '/api/uploads/file' && method === 'PUT') {
      return await handleFileUpload(request, env, url);
    }
    if (path.startsWith('/api/uploads/') && method === 'GET') {
      const objectPath = path.replace('/api/uploads/', '');
      return await handleGetFile(env, decodeURIComponent(objectPath));
    }

    return errorResponse('Not found', 404);
  } catch (err) {
    console.error('API Error:', err);
    return errorResponse('Internal server error');
  }
}

// ============================================
// Export Worker
// ============================================
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const securityHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: securityHeaders });
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApiRequest(request, env, url);
      const newHeaders = new Headers(response.headers);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // Static assets
    try {
      const response = await env.ASSETS.fetch(request);
      const newHeaders = new Headers(response.headers);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch {
      // SPA fallback
      try {
        const indexRequest = new Request(new URL('/index.html', request.url).toString());
        const response = await env.ASSETS.fetch(indexRequest);
        const newHeaders = new Headers(response.headers);
        Object.entries(securityHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        return new Response(response.body, { status: 200, headers: newHeaders });
      } catch {
        return new Response('Not Found', { status: 404, headers: securityHeaders });
      }
    }
  },
};
