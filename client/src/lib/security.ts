/**
 * GrowPod Empire - Frontend Security Utilities
 *
 * Provides validation and sanitization for all user inputs
 * to prevent XSS, injection attacks, and ensure data integrity.
 */

// ============================================
// Algorand-specific Constants
// ============================================
export const ALGORAND_ADDRESS_LENGTH = 58;
export const ALGORAND_TESTNET_CHAIN_ID = 416002;
export const MAX_FEE_MICROALGOS = 10000; // 0.01 ALGO - prevent fee spike attacks

// ============================================
// Address Validation
// ============================================
const ALGORAND_ADDRESS_REGEX = /^[A-Z2-7]{58}$/;

/**
 * Validates an Algorand wallet address
 */
export function isValidAlgorandAddress(address: unknown): address is string {
  if (typeof address !== 'string') return false;
  if (address.length !== ALGORAND_ADDRESS_LENGTH) return false;
  return ALGORAND_ADDRESS_REGEX.test(address);
}

/**
 * Validates and sanitizes an Algorand address for display
 */
export function sanitizeAddress(address: string): string {
  if (!isValidAlgorandAddress(address)) {
    throw new Error('Invalid Algorand address');
  }
  return address;
}

/**
 * Truncates address for display: ABC...XYZ
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!isValidAlgorandAddress(address)) return 'Invalid';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ============================================
// Chain ID Validation (Pera Wallet)
// ============================================
export function isValidTestNetChainId(chainId: number | string): boolean {
  const id = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return id === ALGORAND_TESTNET_CHAIN_ID;
}

// ============================================
// Asset/App ID Validation
// ============================================
export function isValidAssetId(id: unknown): id is number {
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return Number.isInteger(parsed) && parsed > 0;
  }
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

export function isValidAppId(id: unknown): id is number {
  return isValidAssetId(id);
}

// ============================================
// Token Amount Validation
// ============================================
export function isValidTokenAmount(amount: unknown): amount is string {
  if (typeof amount !== 'string') return false;
  if (!/^\d+$/.test(amount)) return false;
  try {
    const bigAmount = BigInt(amount);
    return bigAmount >= BigInt(0) && bigAmount <= BigInt('10000000000000000000');
  } catch {
    return false;
  }
}

// ============================================
// Transaction Fee Validation
// ============================================
export function isValidFee(fee: number): boolean {
  return Number.isInteger(fee) && fee > 0 && fee <= MAX_FEE_MICROALGOS;
}

export function validateSuggestedParams(params: { fee?: number; flatFee?: boolean }): void {
  if (params.flatFee && params.fee && params.fee > MAX_FEE_MICROALGOS) {
    throw new Error(`Fee ${params.fee} exceeds maximum allowed (${MAX_FEE_MICROALGOS})`);
  }
}

// ============================================
// XSS Prevention - HTML Sanitization
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

/**
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips all HTML tags from a string
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes user input for safe display
 */
export function sanitizeForDisplay(input: unknown): string {
  if (typeof input !== 'string') return '';
  return escapeHtml(stripHtmlTags(input));
}

// ============================================
// URL Sanitization
// ============================================
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'ipfs:'];

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SAFE_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  if (!isValidUrl(url)) {
    throw new Error('Invalid or unsafe URL');
  }
  return url;
}

// ============================================
// Number Validation
// ============================================
export function parsePositiveInt(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  throw new Error('Invalid positive integer');
}

export function parseNonNegativeFloat(value: unknown): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num === 'number' && !isNaN(num) && num >= 0) {
    return num;
  }
  throw new Error('Invalid non-negative number');
}

// ============================================
// Note Field Generation (Replay Attack Prevention)
// ============================================
export function generateUniqueNote(prefix: string = 'growpod'): Uint8Array {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const note = `${prefix}:${timestamp}:${random}`;
  return new TextEncoder().encode(note);
}

// ============================================
// Contract Configuration Validation
// ============================================
interface ContractConfig {
  appId: number;
  budAssetId: number;
  terpAssetId: number;
  slotAssetId: number;
  appAddress: string;
}

export function validateContractConfig(config: ContractConfig): void {
  if (!isValidAppId(config.appId)) {
    throw new Error(`Invalid App ID: ${config.appId}`);
  }
  if (!isValidAssetId(config.budAssetId)) {
    throw new Error(`Invalid BUD Asset ID: ${config.budAssetId}`);
  }
  if (!isValidAssetId(config.terpAssetId)) {
    throw new Error(`Invalid TERP Asset ID: ${config.terpAssetId}`);
  }
  if (!isValidAssetId(config.slotAssetId)) {
    throw new Error(`Invalid SLOT Asset ID: ${config.slotAssetId}`);
  }
  if (!isValidAlgorandAddress(config.appAddress)) {
    throw new Error(`Invalid App Address: ${config.appAddress}`);
  }
}

// ============================================
// Logging Safety (no secrets)
// ============================================
const SENSITIVE_PATTERNS = [
  /mnemonic/i,
  /private.?key/i,
  /secret/i,
  /password/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(key));
}

export function sanitizeForLogging(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Mask if it looks like a mnemonic
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
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  return obj;
}
