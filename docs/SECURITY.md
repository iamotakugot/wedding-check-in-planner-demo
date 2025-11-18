# SECURITY BASELINE

## App Security
- Input validation: sanitize user inputs on server; client-side validation does not replace server validation
- Output encoding: avoid dangerouslySetInnerHTML; rely on React escaping
- Authentication/Authorization: require Admin auth for all Admin APIs; RBAC for actions (read, update, check-in)
- Session: httpOnly, secure cookies; SameSite=Lax/Strict; rotate refresh tokens
- CSRF: use SameSite cookies + CSRF token on state-changing requests
- CORS: restrict origins; preflight validation
- Rate limiting & IP allowlist for admin endpoints (optional)
- Logging: structured logs, redact PII and secrets

## Headers / Policies
- HSTS
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (or frame-ancestors in CSP)
- Referrer-Policy: no-referrer
- Content-Security-Policy (CSP): default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' (add API origin)

## Secrets Management
- No secrets in repo
- `.env` only for local; use vault/secret manager for prod; rotate credentials

## Dependencies
- `npm audit` in CI (fail on high)
- CodeQL scanning (JS/TS)
- Renovate/Dependabot (optional)

## Data Protection
- PII minimization: store only what is needed (names, optional phone/email if required)
- Access controls for exports (CSV/PDF)
- Database encryption at rest (cloud managed) and TLS in transit

## Threat Model (high level)
- Spoofed admin -> MFA + IP allowlist
- CSRF -> CSRF tokens + SameSite cookies
- XSS -> auto-escaping, CSP, no raw HTML
- Data exfiltration -> least privilege, encrypted backups, audit logs
