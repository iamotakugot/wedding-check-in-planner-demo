# SECRETS MANAGEMENT

## Local Development
- Create `.env` from `.env.example`
- Never commit `.env`

## Production
- Use cloud secret manager (AWS Secrets Manager, GCP Secret Manager, Vault)
- Rotate secrets regularly
- Principle of Least Privilege on DB users
- Separate environments: dev/stage/prod

## Files
- Root `.env.example`: FRONTEND_API_BASE, NODE_ENV
- Backend `.env.example`: DATABASE_URL, JWT_SECRET, CORS_ORIGIN, NODE_ENV
