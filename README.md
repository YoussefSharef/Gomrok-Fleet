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
- **`server/`** — Express + TypeScript API, Prisma ORM, Postgres database.
  PIN-based sign-in (bcrypt-hashed, JWT sessions) with four roles:
  Administrator, Operations, Maintenance engineer, Operator/supervisor.
  In production, the same Express process also serves the built client
  (`client/dist`) directly — one process, one deploy, no separate static
  host or serverless split.

The app needs a real Postgres database, both locally and in production —
Prisma's `provider` can't be switched at runtime.

## Getting started

```bash
npm install                          # installs both workspaces, generates the Prisma client

cd server
cp .env.example .env                 # set DATABASE_URL to a real Postgres connection string
npm run prisma:migrate               # creates the tables
npm run seed                         # seeds a default Administrator (PIN 1234)
npm run dev                          # http://localhost:4000

# in a second terminal
cd client
npm run dev                          # http://localhost:5173 (proxies /api to :4000)
```

No local Postgres install required — the simplest `DATABASE_URL` is a free
[Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres)
database; point local dev at the same one, or run your own
(`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`).

Sign in as **Administrator** with PIN **1234**, then add your team under
**People & access** — the people you add there fill the operator/engineer
fields elsewhere in the app.

## Deploying

This deploys as one normal Node service — no serverless split, no separate
static host. Any platform that runs "install, build, start" from a Node repo
works: [Render](https://render.com), [Railway](https://railway.app),
[Fly.io](https://fly.io), or your own server/VPS. Using the repo root as the
project root:

- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`
- **Environment variables**: `DATABASE_URL` (a real Postgres connection
  string — e.g. from [Neon](https://neon.tech), which has a free tier), a
  real random `JWT_SECRET` (e.g. `openssl rand -hex 32`), and `PORT` if your
  platform doesn't set it for you.

`npm start` runs `prisma migrate deploy` and the seed script before starting
the server, so the very first deploy already has its tables and the default
Administrator account (PIN 1234) with no separate setup step. Once it's
live, sign in as Administrator, add your own admin account under **People &
access**, and remove the seeded one before sharing the URL with anyone else.

If you specifically want the client and API on two different hosts instead
(e.g. a static host for the client, the API somewhere else), set the
client's `VITE_API_URL` environment variable to the API's URL (including the
`/api` suffix) and the server's `CORS_ORIGIN` to the client's URL — both are
already supported, just unnecessary for the single-service setup above.

## Notes

- Import (replacing the whole equipment register from a JSON backup) is
  restricted to Administrators, since it now writes to a shared database
  rather than one browser's local storage.
- A few decorative fields carried over from the original design mockup
  (attachment upload on the fault report, assigned technician / workshop bay
  on in-house repairs) are not wired to persistence, matching the source
  design's own scope.
