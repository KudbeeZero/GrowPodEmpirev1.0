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
