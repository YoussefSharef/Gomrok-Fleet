import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { peopleRouter } from './routes/people.js';
import { unitsRouter } from './routes/units.js';
import { vendorsRouter } from './routes/vendors.js';
import { dataRouter } from './routes/data.js';

const app = express();
// CORS_ORIGIN restricts cross-origin access to a specific deployed client
// (e.g. https://your-app.vercel.app) in production. Left unset, all origins
// are allowed, which is fine for local development.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : undefined));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/people', peopleRouter);
app.use('/api/units', unitsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/data', dataRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Gomrok Fleet API listening on http://localhost:${port}`);
});
