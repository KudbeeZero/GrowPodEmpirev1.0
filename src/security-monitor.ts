/**
 * GrowPod Empire - Security Monitoring Agent
 *
 * Runs on a scheduled cron trigger to:
 * - Audit database integrity
 * - Detect suspicious activity patterns
 * - Generate security reports
 * - Send email notifications
 *
 * Configure in wrangler.toml:
 * [triggers]
 * crons = ["*/5 * * * *"]  # Every 5 minutes
 */

// ============================================
// Types
// ============================================
interface Env {
  DB: D1Database;
  SECURITY_EMAIL?: string;  // Email to send reports to
  RESEND_API_KEY?: string;  // For email sending
  SECURITY_KV?: KVNamespace; // For storing metrics
}

interface SecurityMetrics {
  timestamp: string;
  totalUsers: number;
  activeUsers24h: number;
  totalHarvests: number;
  suspiciousActivities: SuspiciousActivity[];
  rateLimitViolations: number;
  invalidAddressAttempts: number;
  databaseHealth: DatabaseHealth;
}

interface SuspiciousActivity {
  type: 'rapid_harvests' | 'abnormal_balance' | 'duplicate_addresses' | 'invalid_input_flood';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  walletAddress?: string;
  details: Record<string, unknown>;
}

interface DatabaseHealth {
  usersTable: boolean;
  playerStatsTable: boolean;
  seedBankTable: boolean;
  userSeedsTable: boolean;
  songsTable: boolean;
  announcementsTable: boolean;
  orphanedRecords: number;
  duplicateRecords: number;
}

interface ActivityLog {
  wallet_address: string;
  action_count: number;
  time_window: string;
}

// ============================================
// Security Check Functions
// ============================================

/**
 * Check for users with abnormally high activity rates
 */
async function checkRapidHarvests(db: D1Database): Promise<SuspiciousActivity[]> {
  const activities: SuspiciousActivity[] = [];

  try {
    // Find users with more than 50 harvests in the last hour
    // This could indicate botting or exploitation
    const result = await db.prepare(`
      SELECT wallet_address, total_harvests, updated_at
      FROM player_stats
      WHERE datetime(updated_at) > datetime('now', '-1 hour')
      AND total_harvests > 50
      ORDER BY total_harvests DESC
      LIMIT 10
    `).all<{ wallet_address: string; total_harvests: number; updated_at: string }>();

    for (const row of result.results || []) {
      activities.push({
        type: 'rapid_harvests',
        description: `User ${row.wallet_address.slice(0, 8)}... has ${row.total_harvests} harvests recently`,
        severity: row.total_harvests > 200 ? 'high' : 'medium',
        walletAddress: row.wallet_address,
        details: { totalHarvests: row.total_harvests, lastUpdated: row.updated_at }
      });
    }
  } catch (error) {
    console.error('Error checking rapid harvests:', error);
  }

  return activities;
}

/**
 * Check for abnormal token balances
 */
async function checkAbnormalBalances(db: D1Database): Promise<SuspiciousActivity[]> {
  const activities: SuspiciousActivity[] = [];
  const MAX_REASONABLE_BUD = BigInt('100000000000000'); // 100M BUD with 6 decimals
  const MAX_REASONABLE_TERP = BigInt('10000000000000');  // 10M TERP with 6 decimals

  try {
    const result = await db.prepare(`
      SELECT wallet_address, bud_balance, terp_balance
      FROM users
      WHERE CAST(bud_balance AS INTEGER) > 100000000000000
         OR CAST(terp_balance AS INTEGER) > 10000000000000
    `).all<{ wallet_address: string; bud_balance: string; terp_balance: string }>();

    for (const row of result.results || []) {
      const budBalance = BigInt(row.bud_balance || '0');
      const terpBalance = BigInt(row.terp_balance || '0');

      if (budBalance > MAX_REASONABLE_BUD || terpBalance > MAX_REASONABLE_TERP) {
        activities.push({
          type: 'abnormal_balance',
          description: `User has unusually high token balance`,
          severity: 'high',
          walletAddress: row.wallet_address,
          details: {
            budBalance: row.bud_balance,
            terpBalance: row.terp_balance
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking abnormal balances:', error);
  }

  return activities;
}

/**
 * Check database integrity and health
 */
async function checkDatabaseHealth(db: D1Database): Promise<DatabaseHealth> {
  const health: DatabaseHealth = {
    usersTable: true,
    playerStatsTable: true,
    seedBankTable: true,
    userSeedsTable: true,
    songsTable: true,
    announcementsTable: true,
    orphanedRecords: 0,
    duplicateRecords: 0
  };

  try {
    // Check each table exists and is accessible
    const tables = ['users', 'player_stats', 'seed_bank', 'user_seeds', 'songs', 'announcement_videos'];

    for (const table of tables) {
      try {
        await db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).first();
      } catch {
        const key = `${table.replace('_', '')}Table` as keyof DatabaseHealth;
        if (typeof health[key] === 'boolean') {
          (health as Record<string, unknown>)[key] = false;
        }
      }
    }

    // Check for orphaned user_seeds (seeds referencing non-existent users)
    const orphaned = await db.prepare(`
      SELECT COUNT(*) as count FROM user_seeds us
      LEFT JOIN users u ON us.wallet_address = u.wallet_address
      WHERE u.id IS NULL
    `).first<{ count: number }>();
    health.orphanedRecords = orphaned?.count || 0;

    // Check for duplicate wallet addresses
    const duplicates = await db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT wallet_address FROM users
        GROUP BY wallet_address
        HAVING COUNT(*) > 1
      )
    `).first<{ count: number }>();
    health.duplicateRecords = duplicates?.count || 0;

  } catch (error) {
    console.error('Error checking database health:', error);
  }

  return health;
}

/**
 * Get user activity metrics
 */
async function getActivityMetrics(db: D1Database): Promise<{ totalUsers: number; activeUsers24h: number; totalHarvests: number }> {
  try {
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();

    const activeUsers = await db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE datetime(last_login) > datetime('now', '-24 hours')
    `).first<{ count: number }>();

    const totalHarvests = await db.prepare(`
      SELECT COALESCE(SUM(total_harvests), 0) as count FROM player_stats
    `).first<{ count: number }>();

    return {
      totalUsers: totalUsers?.count || 0,
      activeUsers24h: activeUsers?.count || 0,
      totalHarvests: totalHarvests?.count || 0
    };
  } catch (error) {
    console.error('Error getting activity metrics:', error);
    return { totalUsers: 0, activeUsers24h: 0, totalHarvests: 0 };
  }
}

// ============================================
// Report Generation
// ============================================

/**
 * Generate HTML security report
 */
function generateHtmlReport(metrics: SecurityMetrics): string {
  const severityColors = {
    low: '#3b82f6',      // blue
    medium: '#f59e0b',   // amber
    high: '#ef4444',     // red
    critical: '#dc2626'  // dark red
  };

  const suspiciousHtml = metrics.suspiciousActivities.length > 0
    ? metrics.suspiciousActivities.map(a => `
      <tr style="background: ${a.severity === 'critical' ? '#fef2f2' : a.severity === 'high' ? '#fef3c7' : '#f0fdf4'}">
        <td style="padding: 12px; border: 1px solid #e5e7eb;">
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${severityColors[a.severity]}; margin-right: 8px;"></span>
          ${a.severity.toUpperCase()}
        </td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${a.type}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${a.description}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">
          ${a.walletAddress ? a.walletAddress.slice(0, 12) + '...' : 'N/A'}
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #10b981;">No suspicious activities detected</td></tr>`;

  const dbHealthHtml = Object.entries(metrics.databaseHealth)
    .filter(([key]) => typeof metrics.databaseHealth[key as keyof DatabaseHealth] === 'boolean')
    .map(([key, value]) => `
      <div style="display: flex; align-items: center; padding: 8px 0;">
        <span style="width: 20px; height: 20px; border-radius: 50%; background: ${value ? '#10b981' : '#ef4444'}; margin-right: 12px;"></span>
        <span>${key.replace(/Table$/, '').replace(/([A-Z])/g, ' $1').trim()}</span>
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px; background: #f9fafb; }
    .metric { background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .metric-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section { padding: 24px; border-top: 1px solid #e5e7eb; }
    .section-title { font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; }
    .footer { background: #f9fafb; padding: 16px 24px; text-align: center; color: #6b7280; font-size: 12px; }
    .chart-container { height: 200px; background: #f9fafb; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-top: 16px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 150px; }
    .bar { width: 40px; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%); border-radius: 4px 4px 0 0; transition: height 0.3s; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GrowPod Empire Security Report</h1>
      <p>Generated: ${metrics.timestamp}</p>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${metrics.totalUsers.toLocaleString()}</div>
        <div class="metric-label">Total Users</div>
      </div>
      <div class="metric">
        <div class="metric-value">${metrics.activeUsers24h.toLocaleString()}</div>
        <div class="metric-label">Active (24h)</div>
      </div>
      <div class="metric">
        <div class="metric-value">${metrics.totalHarvests.toLocaleString()}</div>
        <div class="metric-label">Total Harvests</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color: ${metrics.suspiciousActivities.length > 0 ? '#ef4444' : '#10b981'}">
          ${metrics.suspiciousActivities.length}
        </div>
        <div class="metric-label">Alerts</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Security Alerts</h2>
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Type</th>
            <th>Description</th>
            <th>Wallet</th>
          </tr>
        </thead>
        <tbody>
          ${suspiciousHtml}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">Database Health</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div>
          ${dbHealthHtml}
        </div>
        <div>
          <div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
            <div style="margin-bottom: 8px;">
              <span style="color: #6b7280;">Orphaned Records:</span>
              <span style="font-weight: bold; color: ${metrics.databaseHealth.orphanedRecords > 0 ? '#ef4444' : '#10b981'}">
                ${metrics.databaseHealth.orphanedRecords}
              </span>
            </div>
            <div>
              <span style="color: #6b7280;">Duplicate Records:</span>
              <span style="font-weight: bold; color: ${metrics.databaseHealth.duplicateRecords > 0 ? '#ef4444' : '#10b981'}">
                ${metrics.databaseHealth.duplicateRecords}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Activity Trend (Simulated)</h2>
      <div class="chart-container">
        <div class="bar-chart">
          ${[65, 80, 45, 90, 70, 85, 75, 60, 95, 80, 70, 85].map((h, i) =>
            `<div class="bar" style="height: ${h}%;" title="Hour ${i}: ${Math.round(h * metrics.activeUsers24h / 100)} users"></div>`
          ).join('')}
        </div>
      </div>
      <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 8px;">Hourly active users (last 12 hours)</p>
    </div>

    <div class="footer">
      <p>GrowPod Empire Security Monitoring Agent v1.0</p>
      <p>Report ID: ${Date.now().toString(36).toUpperCase()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email report via Resend API
 */
async function sendEmailReport(html: string, env: Env): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.SECURITY_EMAIL) {
    console.log('Email not configured - skipping email send');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GrowPod Security <security@growpod.empire>',
        to: [env.SECURITY_EMAIL],
        subject: `GrowPod Security Report - ${new Date().toISOString().split('T')[0]}`,
        html: html
      })
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Store metrics in KV for historical tracking
 */
async function storeMetrics(metrics: SecurityMetrics, env: Env): Promise<void> {
  if (!env.SECURITY_KV) {
    return;
  }

  try {
    const key = `metrics:${new Date().toISOString().split('.')[0]}`;
    await env.SECURITY_KV.put(key, JSON.stringify(metrics), {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });

    // Also update latest metrics
    await env.SECURITY_KV.put('metrics:latest', JSON.stringify(metrics));
  } catch (error) {
    console.error('Error storing metrics:', error);
  }
}

// ============================================
// Main Scheduled Handler
// ============================================
export default {
  /**
   * Scheduled cron trigger
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Security scan triggered at ${new Date().toISOString()}`);

    try {
      // Gather all security metrics
      const activityMetrics = await getActivityMetrics(env.DB);
      const rapidHarvests = await checkRapidHarvests(env.DB);
      const abnormalBalances = await checkAbnormalBalances(env.DB);
      const databaseHealth = await checkDatabaseHealth(env.DB);

      const metrics: SecurityMetrics = {
        timestamp: new Date().toISOString(),
        totalUsers: activityMetrics.totalUsers,
        activeUsers24h: activityMetrics.activeUsers24h,
        totalHarvests: activityMetrics.totalHarvests,
        suspiciousActivities: [...rapidHarvests, ...abnormalBalances],
        rateLimitViolations: 0, // Would need to track in KV
        invalidAddressAttempts: 0, // Would need to track in KV
        databaseHealth
      };

      // Store metrics for historical tracking
      await storeMetrics(metrics, env);

      // Generate and send report if there are alerts or on schedule
      const hasAlerts = metrics.suspiciousActivities.length > 0;
      const html = generateHtmlReport(metrics);

      if (hasAlerts || event.cron === '0 */1 * * *') { // Send on alerts or hourly
        await sendEmailReport(html, env);
      }

      console.log(`Security scan complete. Found ${metrics.suspiciousActivities.length} alerts.`);
    } catch (error) {
      console.error('Security scan failed:', error);
    }
  },

  /**
   * HTTP handler for manual report generation
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only allow GET /report
    if (url.pathname !== '/report' && url.pathname !== '/') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const activityMetrics = await getActivityMetrics(env.DB);
      const rapidHarvests = await checkRapidHarvests(env.DB);
      const abnormalBalances = await checkAbnormalBalances(env.DB);
      const databaseHealth = await checkDatabaseHealth(env.DB);

      const metrics: SecurityMetrics = {
        timestamp: new Date().toISOString(),
        totalUsers: activityMetrics.totalUsers,
        activeUsers24h: activityMetrics.activeUsers24h,
        totalHarvests: activityMetrics.totalHarvests,
        suspiciousActivities: [...rapidHarvests, ...abnormalBalances],
        rateLimitViolations: 0,
        invalidAddressAttempts: 0,
        databaseHealth
      };

      // Return JSON or HTML based on Accept header
      const acceptsHtml = request.headers.get('Accept')?.includes('text/html');

      if (acceptsHtml) {
        return new Response(generateHtmlReport(metrics), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      return new Response(JSON.stringify(metrics, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
