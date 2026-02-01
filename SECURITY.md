# GrowPod Empire - Security Documentation

## Security Features Implemented

### 1. Input Validation & Sanitization

- **Algorand Address Validation**: All wallet addresses are validated against the proper 58-character base32 format
- **Token Amount Validation**: All token amounts are validated as positive integer strings within safe bounds
- **ID Validation**: All asset IDs, app IDs, and database IDs are validated as positive integers
- **XSS Prevention**: HTML entities are escaped, and dangerous tags are stripped from user inputs
- **SQL Injection Prevention**: All database queries use parameterized statements (D1 prepared statements)

### 2. API Security

- **Rate Limiting**: 100 requests per minute per IP address
- **Security Headers**:
  - `Content-Security-Policy` - Restricts script and resource origins
  - `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
  - `X-Frame-Options: DENY` - Prevents clickjacking
  - `X-XSS-Protection: 1; mode=block` - Enables XSS filter
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **CORS**: Configured for API endpoints

### 3. Frontend Security

- **CSP Meta Tags**: Content Security Policy in HTML head
- **Wallet Chain Verification**: Validates Algorand TestNet chain ID (416002)
- **Fee Limits**: Maximum transaction fee capped at 0.01 ALGO to prevent fee spike attacks
- **Unique Note Fields**: Transactions include unique notes to prevent replay attacks

### 4. Secret Management

- **Environment Variables**: All secrets stored in `.env` (gitignored)
- **No Hardcoded Secrets**: Credentials come from environment only
- **Runtime Checks**: Application fails fast if required env vars are missing
- **Secure Logging**: Sensitive fields are redacted in logs

### 5. Smart Contract Security (PyTeal)

- **Ownership Checks**: All state-modifying operations verify sender ownership
- **Cooldown Enforcement**: Water and nutrient actions enforce 10-minute cooldowns
- **Balance Verification**: Token burns verify sufficient balance before execution
- **Inner Transaction Safety**: All token transfers use inner transactions with proper fee handling

## Known Vulnerabilities (Upstream Dependencies)

The following vulnerabilities exist in transitive dependencies and cannot be fixed without breaking wallet functionality:

### @walletconnect/* Libraries
- **ws 7.x**: DoS vulnerability with many HTTP headers (GHSA-3h5v-q93c-6h6q)
- **Impact**: Low - Only affects server-side WebSocket handling
- **Status**: Waiting for upstream fix in @walletconnect/socket-transport

### Mitigation
- These vulnerabilities are in the WalletConnect v1 libraries used by Pera/Defly wallet connectors
- The risk is mitigated because:
  1. We only use these for client-side wallet connections
  2. No sensitive data is processed through vulnerable code paths
  3. WalletConnect v2 migration is planned when wallet SDKs fully support it

## Security Checklist

- [x] No hardcoded secrets in code
- [x] .env in .gitignore
- [x] .env.example provided
- [x] Input validation on all API endpoints
- [x] Algorand address format validation
- [x] Token amount bounds checking
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (HTML sanitization)
- [x] Security headers on responses
- [x] Rate limiting implemented
- [x] Transaction fee limits
- [x] Unique note fields for replay protection
- [x] Chain ID verification for wallet connections
- [x] Secure logging (no secrets in logs)

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the repository maintainers.
Do NOT create public issues for security vulnerabilities.

## Audit Recommendations

For production deployment, consider:
1. External smart contract audit (PyTeal/TEAL code)
2. Penetration testing of API endpoints
3. Review of wallet integration security
4. Regular dependency updates and monitoring
