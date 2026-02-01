/**
 * GrowPod Empire - Cloudflare Workers API
 * Converted from Express.js to itty-router for D1
 */
import { Router, IRequest } from 'itty-router';

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

interface Song {
  id: number;
  title: string;
  artist: string;
  object_path: string;
  duration: number;
  genre: string;
  cover_art: string | null;
  play_count: number;
  created_at: string;
}

interface AnnouncementVideo {
  id: number;
  title: string;
  object_path: string;
  is_active: number;
  created_at: string;
}

interface SeedBankItem {
  id: number;
  name: string;
  description: string;
  rarity: string;
  terpene_profile: string;
  effects: string;
  flavor_notes: string;
  thc_range: string;
  cbd_range: string;
  growth_bonus: number;
  bud_price: string;
  image_path: string | null;
  glow_color: string;
  total_supply: number | null;
  minted_count: number;
  max_per_user: number | null;
  is_active: number;
  created_at: string;
}

interface UserSeed {
  id: number;
  wallet_address: string;
  seed_id: number;
  quantity: number;
  purchased_at: string;
}

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  value: number;
  displayValue: string;
  rawValue?: string;
}

// ============================================
// Helpers
// ============================================
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ message }, status);
}

function formatTokenAmount(amount: string): string {
  const num = BigInt(amount || '0');
  const decimals = BigInt(1000000);
  const whole = num / decimals;
  if (whole >= BigInt(1000000)) {
    return `${(Number(whole) / 1000000).toFixed(1)}M`;
  } else if (whole >= BigInt(1000)) {
    return `${(Number(whole) / 1000).toFixed(1)}K`;
  }
  return whole.toString();
}

// Convert snake_case DB results to camelCase for API compatibility
function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// ============================================
// Router Setup
// ============================================
const router = Router();

// CORS preflight
router.options('*', () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
}));

// ============================================
// User Routes
// ============================================
router.post('/api/users/login', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string };
    const { walletAddress } = body;

    if (!walletAddress || walletAddress.length !== 58) {
      return errorResponse('Invalid wallet address', 400);
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
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Failed to login');
  }
});

router.post('/api/users/sync-balances', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string; budBalance: string; terpBalance: string };
    const { walletAddress, budBalance, terpBalance } = body;

    await env.DB.prepare(
      'UPDATE users SET bud_balance = ?, terp_balance = ? WHERE wallet_address = ?'
    ).bind(budBalance, terpBalance, walletAddress).run();

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first<User>();

    return jsonResponse(toCamelCase(user!));
  } catch (err) {
    console.error('Sync balances error:', err);
    return errorResponse('Failed to sync balances');
  }
});

router.get('/api/users/:walletAddress', async (req: IRequest, env: Env) => {
  const { walletAddress } = req.params;

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE wallet_address = ?'
  ).bind(walletAddress).first<User>();

  if (!user) {
    return errorResponse('User not found', 404);
  }

  return jsonResponse(toCamelCase(user));
});

// ============================================
// Config Routes
// ============================================
router.get('/api/config', () => {
  return jsonResponse({ network: 'testnet' });
});

// ============================================
// Leaderboard Routes
// ============================================
router.get('/api/leaderboard/harvests', async (_req: IRequest, env: Env) => {
  try {
    const results = await env.DB.prepare(
      'SELECT * FROM player_stats ORDER BY total_harvests DESC LIMIT 20'
    ).all<PlayerStats>();

    const leaderboard: LeaderboardEntry[] = (results.results || []).map((r, idx) => ({
      rank: idx + 1,
      wallet: r.wallet_address,
      value: r.total_harvests,
      displayValue: r.total_harvests.toString(),
    }));

    return jsonResponse(leaderboard);
  } catch (err) {
    console.error('Harvest leaderboard error:', err);
    return errorResponse('Failed to get leaderboard');
  }
});

router.get('/api/leaderboard/bud', async (_req: IRequest, env: Env) => {
  try {
    const results = await env.DB.prepare(
      'SELECT * FROM player_stats ORDER BY CAST(total_bud_earned AS INTEGER) DESC LIMIT 20'
    ).all<PlayerStats>();

    const leaderboard: LeaderboardEntry[] = (results.results || []).map((r, idx) => ({
      rank: idx + 1,
      wallet: r.wallet_address,
      value: 0,
      displayValue: formatTokenAmount(r.total_bud_earned),
      rawValue: r.total_bud_earned,
    }));

    return jsonResponse(leaderboard);
  } catch (err) {
    console.error('BUD leaderboard error:', err);
    return errorResponse('Failed to get leaderboard');
  }
});

router.get('/api/leaderboard/terp', async (_req: IRequest, env: Env) => {
  try {
    const results = await env.DB.prepare(
      'SELECT * FROM player_stats ORDER BY CAST(total_terp_earned AS INTEGER) DESC LIMIT 20'
    ).all<PlayerStats>();

    const leaderboard: LeaderboardEntry[] = (results.results || []).map((r, idx) => ({
      rank: idx + 1,
      wallet: r.wallet_address,
      value: 0,
      displayValue: formatTokenAmount(r.total_terp_earned),
      rawValue: r.total_terp_earned,
    }));

    return jsonResponse(leaderboard);
  } catch (err) {
    console.error('TERP leaderboard error:', err);
    return errorResponse('Failed to get leaderboard');
  }
});

// ============================================
// Stats Routes
// ============================================
router.get('/api/stats/global', async (_req: IRequest, env: Env) => {
  try {
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
  } catch (err) {
    console.error('Global stats error:', err);
    return errorResponse('Failed to get stats');
  }
});

router.post('/api/stats/record-harvest', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string; budEarned: string; terpEarned?: string; isRareTerp?: boolean };
    const { walletAddress, budEarned, terpEarned = '0', isRareTerp = false } = body;

    if (!walletAddress || walletAddress.length !== 58) {
      return errorResponse('Invalid wallet address', 400);
    }

    // Get or create player stats
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

    // Calculate new totals
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
  } catch (err) {
    console.error('Record harvest error:', err);
    return errorResponse('Failed to record harvest');
  }
});

// ============================================
// Jukebox Routes
// ============================================
router.get('/api/jukebox/songs', async (_req: IRequest, env: Env) => {
  try {
    const results = await env.DB.prepare(
      'SELECT * FROM songs ORDER BY created_at DESC'
    ).all<Song>();

    return jsonResponse((results.results || []).map(s => toCamelCase(s)));
  } catch (err) {
    console.error('Get songs error:', err);
    return errorResponse('Failed to get songs');
  }
});

router.post('/api/jukebox/songs', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { title: string; artist: string; objectPath: string; duration?: number; genre?: string; coverArt?: string };
    const { title, artist, objectPath, duration = 0, genre = 'chill', coverArt } = body;

    await env.DB.prepare(
      'INSERT INTO songs (title, artist, object_path, duration, genre, cover_art) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(title, artist, objectPath, duration, genre, coverArt || null).run();

    const song = await env.DB.prepare(
      'SELECT * FROM songs ORDER BY id DESC LIMIT 1'
    ).first<Song>();

    return jsonResponse(toCamelCase(song!), 201);
  } catch (err) {
    console.error('Create song error:', err);
    return errorResponse('Failed to create song');
  }
});

router.delete('/api/jukebox/songs/:id', async (req: IRequest, env: Env) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid song ID', 400);
    }

    await env.DB.prepare('DELETE FROM songs WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Delete song error:', err);
    return errorResponse('Failed to delete song');
  }
});

router.post('/api/jukebox/songs/:id/play', async (req: IRequest, env: Env) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid song ID', 400);
    }

    await env.DB.prepare(
      'UPDATE songs SET play_count = play_count + 1 WHERE id = ?'
    ).bind(id).run();

    const song = await env.DB.prepare(
      'SELECT * FROM songs WHERE id = ?'
    ).bind(id).first<Song>();

    if (!song) {
      return errorResponse('Song not found', 404);
    }

    return jsonResponse(toCamelCase(song));
  } catch (err) {
    console.error('Play count error:', err);
    return errorResponse('Failed to update play count');
  }
});

// ============================================
// Announcement Routes
// ============================================
router.get('/api/announcement/current', async (_req: IRequest, env: Env) => {
  try {
    const announcement = await env.DB.prepare(
      'SELECT * FROM announcement_videos WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<AnnouncementVideo>();

    return jsonResponse(announcement ? toCamelCase(announcement) : null);
  } catch (err) {
    console.error('Get announcement error:', err);
    return errorResponse('Failed to get announcement');
  }
});

router.get('/api/announcement/check/:walletAddress', async (req: IRequest, env: Env) => {
  try {
    const { walletAddress } = req.params;

    const announcement = await env.DB.prepare(
      'SELECT * FROM announcement_videos WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<AnnouncementVideo>();

    if (!announcement) {
      return jsonResponse({ needsToWatch: false, announcement: null });
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first<User>();

    const hasWatched = user?.last_seen_announcement_id === announcement.id;

    return jsonResponse({
      needsToWatch: !hasWatched,
      announcement: hasWatched ? null : toCamelCase(announcement),
    });
  } catch (err) {
    console.error('Check announcement error:', err);
    return errorResponse('Failed to check announcement');
  }
});

router.post('/api/announcement', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string; title: string; objectPath: string };
    const { walletAddress, title, objectPath } = body;

    const ADMIN_WALLET = env.ADMIN_WALLET_ADDRESS || '';
    if (ADMIN_WALLET && walletAddress !== ADMIN_WALLET) {
      return errorResponse('Only admin can upload announcements', 403);
    }

    // Deactivate all announcements
    await env.DB.prepare('UPDATE announcement_videos SET is_active = 0').run();

    // Create new announcement
    await env.DB.prepare(
      'INSERT INTO announcement_videos (title, object_path, is_active) VALUES (?, ?, 1)'
    ).bind(title, objectPath).run();

    const announcement = await env.DB.prepare(
      'SELECT * FROM announcement_videos ORDER BY id DESC LIMIT 1'
    ).first<AnnouncementVideo>();

    return jsonResponse(toCamelCase(announcement!), 201);
  } catch (err) {
    console.error('Create announcement error:', err);
    return errorResponse('Failed to create announcement');
  }
});

router.post('/api/announcement/watched', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string; announcementId: number };
    const { walletAddress, announcementId } = body;

    if (!walletAddress || !announcementId) {
      return errorResponse('Missing walletAddress or announcementId', 400);
    }

    await env.DB.prepare(
      'UPDATE users SET last_seen_announcement_id = ? WHERE wallet_address = ?'
    ).bind(announcementId, walletAddress).run();

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wallet_address = ?'
    ).bind(walletAddress).first<User>();

    return jsonResponse({ success: true, user: toCamelCase(user!) });
  } catch (err) {
    console.error('Mark watched error:', err);
    return errorResponse('Failed to mark as watched');
  }
});

router.get('/api/announcement/admin-check/:walletAddress', async (req: IRequest, env: Env) => {
  const { walletAddress } = req.params;
  const ADMIN_WALLET = env.ADMIN_WALLET_ADDRESS || '';
  const isAdmin = ADMIN_WALLET ? walletAddress === ADMIN_WALLET : true;
  return jsonResponse({ isAdmin });
});

// ============================================
// Seed Bank Routes
// ============================================
router.get('/api/seed-bank', async (_req: IRequest, env: Env) => {
  try {
    const results = await env.DB.prepare(
      'SELECT * FROM seed_bank WHERE is_active = 1 ORDER BY created_at DESC'
    ).all<SeedBankItem>();

    const seeds = (results.results || []).map(s => ({
      ...toCamelCase(s),
      terpeneProfile: JSON.parse(s.terpene_profile || '[]'),
      effects: JSON.parse(s.effects || '[]'),
      flavorNotes: JSON.parse(s.flavor_notes || '[]'),
    }));

    return jsonResponse(seeds);
  } catch (err) {
    console.error('Get seeds error:', err);
    return errorResponse('Failed to get seeds');
  }
});

router.get('/api/seed-bank/:id', async (req: IRequest, env: Env) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid seed ID', 400);
    }

    const seed = await env.DB.prepare(
      'SELECT * FROM seed_bank WHERE id = ?'
    ).bind(id).first<SeedBankItem>();

    if (!seed) {
      return errorResponse('Seed not found', 404);
    }

    return jsonResponse({
      ...toCamelCase(seed),
      terpeneProfile: JSON.parse(seed.terpene_profile || '[]'),
      effects: JSON.parse(seed.effects || '[]'),
      flavorNotes: JSON.parse(seed.flavor_notes || '[]'),
    });
  } catch (err) {
    console.error('Get seed error:', err);
    return errorResponse('Failed to get seed');
  }
});

router.post('/api/seed-bank', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as {
      walletAddress: string;
      name: string;
      description: string;
      rarity?: string;
      terpeneProfile?: string[];
      effects?: string[];
      flavorNotes?: string[];
      thcRange?: string;
      cbdRange?: string;
      growthBonus?: number;
      budPrice?: string;
      imagePath?: string;
      glowColor?: string;
      totalSupply?: number;
      maxPerUser?: number;
    };

    const ADMIN_WALLET = env.ADMIN_WALLET_ADDRESS || '';
    if (ADMIN_WALLET && body.walletAddress !== ADMIN_WALLET) {
      return errorResponse('Only admin can create seeds', 403);
    }

    await env.DB.prepare(`
      INSERT INTO seed_bank (name, description, rarity, terpene_profile, effects, flavor_notes, thc_range, cbd_range, growth_bonus, bud_price, image_path, glow_color, total_supply, max_per_user)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.description,
      body.rarity || 'common',
      JSON.stringify(body.terpeneProfile || []),
      JSON.stringify(body.effects || []),
      JSON.stringify(body.flavorNotes || []),
      body.thcRange || '15-20%',
      body.cbdRange || '0-1%',
      body.growthBonus || 0,
      body.budPrice || '1000',
      body.imagePath || null,
      body.glowColor || '#a855f7',
      body.totalSupply || null,
      body.maxPerUser || 1
    ).run();

    const seed = await env.DB.prepare(
      'SELECT * FROM seed_bank ORDER BY id DESC LIMIT 1'
    ).first<SeedBankItem>();

    return jsonResponse({
      ...toCamelCase(seed!),
      terpeneProfile: JSON.parse(seed!.terpene_profile || '[]'),
      effects: JSON.parse(seed!.effects || '[]'),
      flavorNotes: JSON.parse(seed!.flavor_notes || '[]'),
    }, 201);
  } catch (err) {
    console.error('Create seed error:', err);
    return errorResponse('Failed to create seed');
  }
});

router.delete('/api/seed-bank/:id', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string };

    const ADMIN_WALLET = env.ADMIN_WALLET_ADDRESS || '';
    if (ADMIN_WALLET && body.walletAddress !== ADMIN_WALLET) {
      return errorResponse('Only admin can delete seeds', 403);
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid seed ID', 400);
    }

    await env.DB.prepare(
      'UPDATE seed_bank SET is_active = 0 WHERE id = ?'
    ).bind(id).run();

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Delete seed error:', err);
    return errorResponse('Failed to delete seed');
  }
});

router.post('/api/seed-bank/:id/purchase', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string };
    const { walletAddress } = body;

    if (!walletAddress) {
      return errorResponse('Wallet address required', 400);
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid seed ID', 400);
    }

    const seed = await env.DB.prepare(
      'SELECT * FROM seed_bank WHERE id = ?'
    ).bind(id).first<SeedBankItem>();

    if (!seed) {
      return errorResponse('Seed not found', 404);
    }

    // Check supply limit
    if (seed.total_supply !== null && seed.minted_count >= seed.total_supply) {
      return errorResponse('Seed sold out', 400);
    }

    // Check per-user limit
    if (seed.max_per_user !== null) {
      const existing = await env.DB.prepare(
        'SELECT quantity FROM user_seeds WHERE wallet_address = ? AND seed_id = ?'
      ).bind(walletAddress, id).first<{ quantity: number }>();

      if (existing && existing.quantity >= seed.max_per_user) {
        return errorResponse(`You can only own ${seed.max_per_user} of this seed`, 400);
      }
    }

    // Increment minted count
    await env.DB.prepare(
      'UPDATE seed_bank SET minted_count = minted_count + 1 WHERE id = ?'
    ).bind(id).run();

    // Check if user already has this seed
    const existing = await env.DB.prepare(
      'SELECT * FROM user_seeds WHERE wallet_address = ? AND seed_id = ?'
    ).bind(walletAddress, id).first<UserSeed>();

    if (existing) {
      await env.DB.prepare(
        'UPDATE user_seeds SET quantity = quantity + 1 WHERE id = ?'
      ).bind(existing.id).run();

      const updated = await env.DB.prepare(
        'SELECT * FROM user_seeds WHERE id = ?'
      ).bind(existing.id).first<UserSeed>();

      return jsonResponse(toCamelCase(updated!), 201);
    }

    await env.DB.prepare(
      'INSERT INTO user_seeds (wallet_address, seed_id, quantity) VALUES (?, ?, 1)'
    ).bind(walletAddress, id).run();

    const created = await env.DB.prepare(
      'SELECT * FROM user_seeds WHERE wallet_address = ? AND seed_id = ?'
    ).bind(walletAddress, id).first<UserSeed>();

    return jsonResponse(toCamelCase(created!), 201);
  } catch (err) {
    console.error('Purchase seed error:', err);
    return errorResponse('Failed to purchase seed');
  }
});

router.get('/api/user-seeds/:walletAddress', async (req: IRequest, env: Env) => {
  try {
    const { walletAddress } = req.params;

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
  } catch (err) {
    console.error('Get user seeds error:', err);
    return errorResponse('Failed to get user seeds');
  }
});

router.post('/api/user-seeds/:seedId/use', async (req: IRequest, env: Env) => {
  try {
    const body = await req.json() as { walletAddress: string };
    const { walletAddress } = body;

    if (!walletAddress) {
      return errorResponse('Wallet address required', 400);
    }

    const seedId = parseInt(req.params.seedId);
    if (isNaN(seedId)) {
      return errorResponse('Invalid seed ID', 400);
    }

    const existing = await env.DB.prepare(
      'SELECT * FROM user_seeds WHERE wallet_address = ? AND seed_id = ?'
    ).bind(walletAddress, seedId).first<UserSeed>();

    if (!existing || existing.quantity <= 0) {
      return errorResponse('No seeds available to use', 400);
    }

    if (existing.quantity === 1) {
      await env.DB.prepare(
        'DELETE FROM user_seeds WHERE id = ?'
      ).bind(existing.id).run();
    } else {
      await env.DB.prepare(
        'UPDATE user_seeds SET quantity = quantity - 1 WHERE id = ?'
      ).bind(existing.id).run();
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Use seed error:', err);
    return errorResponse('Failed to use seed');
  }
});

// ============================================
// Static Assets (catch-all)
// ============================================
router.all('*', async (req: IRequest, env: Env) => {
  // Try to serve static assets
  try {
    return await env.ASSETS.fetch(req);
  } catch {
    return errorResponse('Not found', 404);
  }
});

// ============================================
// Export Worker
// ============================================
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await router.handle(request, env, ctx);

    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Clone response and add headers
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
