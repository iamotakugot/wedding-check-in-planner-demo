import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// TODO: implement routes per api/openapi.yaml

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${PORT}`);
});
