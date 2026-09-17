import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { peopleRouter } from './routes/people.js';
import { unitsRouter } from './routes/units.js';
import { vendorsRouter } from './routes/vendors.js';
import { dataRouter } from './routes/data.js';

const app = express();
app.use(cors());
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
