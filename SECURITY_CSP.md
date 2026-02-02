# Content Security Policy (CSP) Configuration

## Current Configuration

The CSP in `client/index.html` currently allows `'unsafe-inline'` for scripts and styles for the following reasons:

### Development Mode
- **Vite Development Server**: Requires inline scripts for Hot Module Replacement (HMR)
- **React DevTools**: May inject inline scripts during development

### Third-Party Dependencies
- **Wallet Connectors**: WalletConnect and other Algorand wallet providers may use inline scripts
- **Style Libraries**: Tailwind CSS and inline styles from component libraries

## Production Recommendations

For production deployment, implement a stricter CSP:

### Option 1: Nonce-Based CSP (Recommended)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'nonce-{RANDOM_NONCE}'; 
               style-src 'self' 'nonce-{RANDOM_NONCE}' https://fonts.googleapis.com; 
               ...">
```

Generate a unique nonce per page load and inject it into both the CSP header and script tags.

### Option 2: Hash-Based CSP
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'sha256-{HASH_OF_SCRIPT}'; 
               ...">
```

Calculate SHA-256 hashes of all inline scripts and add them to the CSP.

### Option 3: Remove All Inline Scripts
- Extract all inline scripts to separate `.js` files
- Use bundler to include them in the build
- Remove `'unsafe-inline'` completely

## Removed: 'unsafe-eval'

We removed `'unsafe-eval'` as it was not necessary:
- No `eval()` calls in the codebase
- No `new Function()` usage
- All dynamic code is handled through proper bundling

## Implementation for Cloudflare Workers

When deploying to Cloudflare Workers, set CSP headers in the worker:

```typescript
// src/worker.ts
const response = await fetch(request);
const newHeaders = new Headers(response.headers);

// Production CSP with nonce
const nonce = crypto.randomUUID();
newHeaders.set('Content-Security-Policy', 
  `default-src 'self'; script-src 'self' 'nonce-${nonce}'; ...`
);

return new Response(response.body, {
  headers: newHeaders,
  status: response.status,
  statusText: response.statusText
});
```

## Current Compromise

Until production CSP is implemented:
- ✅ Removed `'unsafe-eval'` (not needed)
- ⚠️ Kept `'unsafe-inline'` for scripts (needed for Vite dev mode)
- ⚠️ Kept `'unsafe-inline'` for styles (needed for Tailwind)

This provides reasonable protection against XSS while maintaining development workflow.
