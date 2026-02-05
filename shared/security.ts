/**
 * GrowPod Empire - Security Utilities
 * Centralized validation and sanitization for all inputs
 */
import { z } from 'zod';

// ============================================
// Constants
// ============================================
export const ALGORAND_ADDRESS_LENGTH = 58;
export const ALGORAND_TESTNET_CHAIN_ID = 416002;
export const MAX_FEE_MICROALGOS = 10000; // 0.01 ALGO max fee
export const MIN_BALANCE_MICROALGOS = 100000; // 0.1 ALGO minimum

// ============================================
// Algorand Address Validation
// ============================================
const ALGORAND_ADDRESS_REGEX = /^[A-Z2-7]{58}$/;

export function isValidAlgorandAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== ALGORAND_ADDRESS_LENGTH) return false;
  return ALGORAND_ADDRESS_REGEX.test(address);
}

// Zod schema for Algorand address
export const algorandAddressSchema = z
  .string()
  .length(ALGORAND_ADDRESS_LENGTH, 'Algorand address must be exactly 58 characters')
  .regex(ALGORAND_ADDRESS_REGEX, 'Invalid Algorand address format');

// ============================================
// Asset ID Validation
// ============================================
export function isValidAssetId(assetId: number | string): boolean {
  const id = typeof assetId === 'string' ? parseInt(assetId, 10) : assetId;
  return Number.isInteger(id) && id > 0 && id <= Number.MAX_SAFE_INTEGER;
}

export const assetIdSchema = z
  .number()
  .int('Asset ID must be an integer')
  .positive('Asset ID must be positive')
  .max(Number.MAX_SAFE_INTEGER, 'Asset ID too large');

// ============================================
// App ID Validation
// ============================================
export function isValidAppId(appId: number | string): boolean {
  const id = typeof appId === 'string' ? parseInt(appId, 10) : appId;
  return Number.isInteger(id) && id > 0 && id <= Number.MAX_SAFE_INTEGER;
}

export const appIdSchema = z
  .number()
  .int('App ID must be an integer')
  .positive('App ID must be positive')
  .max(Number.MAX_SAFE_INTEGER, 'App ID too large');

// ============================================
// Token Amount Validation (microunits)
// ============================================
export function isValidTokenAmount(amount: string): boolean {
  if (!amount || typeof amount !== 'string') return false;
  // Must be a positive integer string (no decimals, no negative)
  if (!/^\d+$/.test(amount)) return false;
  try {
    const bigAmount = BigInt(amount);
    return bigAmount >= BigInt(0) && bigAmount <= BigInt('10000000000000000000'); // 10 billion with 6 decimals
  } catch {
    return false;
  }
}

export const tokenAmountSchema = z
  .string()
  .regex(/^\d+$/, 'Token amount must be a positive integer string')
  .refine(
    (val) => {
      try {
        const bigAmount = BigInt(val);
        return bigAmount >= BigInt(0) && bigAmount <= BigInt('10000000000000000000');
      } catch {
        return false;
      }
    },
    'Token amount out of valid range'
  );

// ============================================
// Text Sanitization (XSS Prevention)
// ============================================
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

// Strip all HTML tags
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}

// Sanitize for safe display (combines stripping and escaping)
export function sanitizeForDisplay(input: string): string {
  return sanitizeHtml(stripHtmlTags(input));
}

// ============================================
// SQL/NoSQL Injection Prevention
// ============================================
const DANGEROUS_SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
  /'\s*(OR|AND)\s*'?[^']*'?\s*=\s*'?[^']*'?/gi,
];

export function containsSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return DANGEROUS_SQL_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove dangerous characters and patterns
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// ============================================
// Integer ID Validation
// ============================================
export function parsePositiveInt(value: unknown, fieldName: string = 'ID'): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${fieldName}: must be a positive integer`);
  }
  return parsed;
}

export const positiveIntSchema = z
  .union([z.number(), z.string()])
  .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
  .refine((val) => Number.isInteger(val) && val > 0, 'Must be a positive integer');

// ============================================
// Rate Limiting Helper
// ============================================
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================
// Request Validation Schemas
// ============================================
export const loginRequestSchema = z.object({
  walletAddress: algorandAddressSchema,
});

export const syncBalancesRequestSchema = z.object({
  walletAddress: algorandAddressSchema,
  budBalance: tokenAmountSchema,
  terpBalance: tokenAmountSchema,
});

export const recordHarvestRequestSchema = z.object({
  walletAddress: algorandAddressSchema,
  budEarned: tokenAmountSchema,
  terpEarned: tokenAmountSchema.optional().default('0'),
  isRareTerp: z.boolean().optional().default(false),
});

export const purchaseSeedRequestSchema = z.object({
  walletAddress: algorandAddressSchema,
});

// ============================================
// Secure Logging (never log secrets)
// ============================================
const SENSITIVE_PATTERNS = [
  /mnemonic/i,
  /private.?key/i,
  /secret/i,
  /password/i,
  /api.?key/i,
  /bearer/i,
  /authorization/i,
];

export function sanitizeForLogging(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Mask if it looks like a mnemonic (25 words)
    if (obj.split(/\s+/).length >= 24) {
      return '[REDACTED_MNEMONIC]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_PATTERNS.some((p) => p.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return obj;
}

export function secureLog(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const sanitizedData = data ? sanitizeForLogging(data) : undefined;
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logFn(`[${level.toUpperCase()}] ${message}`, sanitizedData || '');
}
