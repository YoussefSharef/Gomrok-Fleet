import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { peopleRouter } from './routes/people.js';
import { unitsRouter } from './routes/units.js';
import { vendorsRouter } from './routes/vendors.js';
import { dataRouter } from './routes/data.js';

export const app = express();

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

// Serve the built client (client/dist) as one deployed process, so hosting
// this needs nothing beyond "build, then start" -- no separate static host,
// no serverless split. Skipped in local dev, where the client normally runs
// its own Vite dev server instead (npm run dev in client/, proxying /api).
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
