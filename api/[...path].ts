// Vercel serverless entry point. The filename `[...path].ts` makes Vercel
// route every request under /api/* to this function (filesystem routing),
// which just hands the request straight to the same Express app used for
// local dev and non-serverless hosting (server/src/app.ts) -- Express apps
// are directly callable as (req, res) => void, which is exactly the
// signature a Vercel Node function expects.
import { app } from '../server/src/app.js';

export default app;
