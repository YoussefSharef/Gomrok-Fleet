import { app } from './app.js';

// Used for local development and for hosting the API as a normal, always-on
// process (Render, Railway, Fly.io, ...). Not used when the app is deployed
// as a Vercel serverless function -- see /api/[...path].ts at the repo root,
// which imports `app` directly and never calls listen().
const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Gomrok Fleet API listening on http://localhost:${port}`);
});
