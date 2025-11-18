# THREAT MODEL (High-level)

## Assets
- Guest PII (names, optional contact)
- Seating/zone plan (sensitive logistics)
- Admin session

## Actors
- Admin users
- Guests (RSVP app)
- External attacker

## STRIDE
- Spoofing: stolen admin creds → MFA, IP allowlist, strong passwords
- Tampering: unauthorized updates → RBAC, audit logs, signatures on exports
- Repudiation: dispute actions → immutable logs with actor/time
- Information Disclosure: data leak → ACLs, encryption at rest, narrow API responses
- Denial of Service: rate limit, WAF
- Elevation of Privilege: server-side authorization checks, least privilege

## Notes
- Audit check-in actions (who, when, method)
- Protect export endpoints with strong auth and short-lived signed URLs
