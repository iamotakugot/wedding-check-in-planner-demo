# Backend (Stub)

Node.js + Express (skeleton) for future integration.

## Dev

```
npm install
npm run dev
```

## Env
- Create `.env` from `.env.example`
- DATABASE_URL=postgres://user:pass@host:5432/db
- CORS_ORIGIN=https://your-frontend

## Endpoints (see ../api/openapi.yaml)
- GET/POST /api/guests
- PATCH /api/guests/:id/checkin
- GET /api/zones
- GET /api/tables
- POST /api/rsvps
