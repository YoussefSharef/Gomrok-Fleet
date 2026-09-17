# Gomrok Fleet — Equipment Maintenance

Equipment maintenance tracker for Gomrok's material-handling fleet (forklifts,
reach trucks, trans pallets, radio shuttles, remote controls, batteries and
chargers): a live register of assets, preventive service plans, a two-stage
fault workflow (operations report → engineer review/approval), maintenance
company management, a service calendar, and cost/reliability reporting.
Printable A4 maintenance reports and QR asset tags are generated client-side.
The UI is fully bilingual (English / Arabic, with RTL layout).

## Stack

- **`client/`** — React + TypeScript + Vite SPA.
- **`server/`** — Express + TypeScript API, Prisma ORM, SQLite database.
  PIN-based sign-in (bcrypt-hashed, JWT sessions) with four roles:
  Administrator, Operations, Maintenance engineer, Operator/supervisor.

## Getting started

```bash
npm install                          # installs both workspaces

cd server
cp .env.example .env
npm run prisma:migrate               # creates server/prisma/dev.db
npm run seed                         # seeds a default Administrator (PIN 1234)
npm run dev                          # http://localhost:4000

# in a second terminal
cd client
npm run dev                          # http://localhost:5173 (proxies /api to :4000)
```

Sign in as **Administrator** with PIN **1234**, then add your team under
**People & access** — the people you add there fill the operator/engineer
fields elsewhere in the app.

## Deploying: client on Vercel, server elsewhere

The server is a normal, always-on Node process with a SQLite file on disk —
that doesn't fit Vercel's serverless model, so **only `client/` goes on
Vercel**. Deploy `server/` to a host that runs a persistent process, such as
[Render](https://render.com), [Railway](https://railway.app), or
[Fly.io](https://fly.io).

**1. Server** (example: Render "Web Service")
- Root directory: `server/`
- Build command: `npm install && npm run build`
- Start command: `npm start` (runs `prisma migrate deploy` then starts the API)
- Environment variables: `DATABASE_URL`, `JWT_SECRET` (a real random secret —
  not the dev default), `CORS_ORIGIN` (your Vercel URL, once you have it,
  comma-separated if there's more than one)
- **SQLite needs a persistent disk.** On most platforms' free tiers the
  filesystem is wiped on every restart/redeploy, which would silently erase
  your equipment register. Attach a persistent volume/disk and point
  `DATABASE_URL` at a path on it (e.g. `file:/data/dev.db` on Render, or a
  Railway/Fly volume mount) — or plan to move to a hosted database (Postgres,
  Turso, etc.) later if you outgrow this.
- Note the deployed API's URL, e.g. `https://your-api.onrender.com`.

**2. Client** (Vercel)
- Root directory: `client/`
- Framework preset: Vite (build command `npm run build`, output `dist`)
- Environment variable: `VITE_API_URL=https://your-api.onrender.com/api`
  (must include the `/api` suffix)
- `client/vercel.json` already adds the SPA rewrite Vercel needs so client-side
  routes (e.g. `/units/FL-01`) don't 404 on refresh.

Once both are live, go back and set the server's `CORS_ORIGIN` to the
Vercel URL Vercel gave you, and redeploy the server.

## Notes

- Import (replacing the whole equipment register from a JSON backup) is
  restricted to Administrators, since it now writes to a shared database
  rather than one browser's local storage.
- A few decorative fields carried over from the original design mockup
  (attachment upload on the fault report, assigned technician / workshop bay
  on in-house repairs) are not wired to persistence, matching the source
  design's own scope.
