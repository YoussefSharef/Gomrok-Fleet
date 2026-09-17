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
- **`api/`** — a single Vercel serverless function (`[...path].ts`) that
  wraps the same Express app for a one-project Vercel deployment. Not used
  when running `server/` as its own process (local dev, or hosting it on
  Render/Railway/Fly instead — see below).

The app needs a real Postgres database, both locally and in production —
Prisma's `provider` can't be switched at runtime, and a plain SQLite file
doesn't survive Vercel's serverless filesystem anyway.

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

## Deploying everything to Vercel

This is one Vercel project: the client is served as a static build, and
`/api/*` is routed (via `vercel.json`) to a single serverless function that
runs the same Express app. The only thing you need to do yourself is attach
a database, since Claude Code can't provision cloud resources on your
account:

1. **Import the repo into Vercel** as a new project, with the **root
   directory left as the repo root** (not `client/`) — `vercel.json` at the
   root already sets the build command and output directory for you.
2. **Add a Postgres database**: in the project's *Storage* tab, add
   "Postgres" (or create one on [Neon](https://neon.tech) and add its
   connection string manually). Either way, add an environment variable
   named exactly **`DATABASE_URL`** with that connection string — if Vercel's
   own Postgres storage gives you differently-named variables (`POSTGRES_URL`,
   `POSTGRES_PRISMA_URL`, ...), copy one of those values into a `DATABASE_URL`
   variable too, since that's the name Prisma is configured to read.
3. **Add `JWT_SECRET`**: any long random string (e.g. `openssl rand -hex 32`).
4. **Deploy.** The build command (`vercel.json`) runs `prisma migrate deploy`
   and the seed script against that database automatically on every deploy,
   so the first deploy already has the tables and the default Administrator
   account — no separate setup step needed.

Sign in with **Administrator** / **1234** once it's live, then change that
PIN (add a new Administrator under People & access, then remove the seeded
one) before giving anyone else the URL.

### Alternative: split deployment (client on Vercel, API elsewhere)

If you'd rather run the API as a normal always-on process instead of a
serverless function (e.g. to keep using SQLite, or for easier debugging),
deploy `server/` by itself to [Render](https://render.com),
[Railway](https://railway.app), or [Fly.io](https://fly.io) — root directory
`server/`, build `npm install && npm run build`, start `npm start` — and set
the client's `VITE_API_URL` environment variable to that API's URL (with the
`/api` suffix). Set `CORS_ORIGIN` on the server to the client's Vercel URL.
`client/src/api/client.ts` already supports this via `VITE_API_URL`; it's
just unnecessary for the single-project setup above, where the client and
API share an origin.

## Notes

- Import (replacing the whole equipment register from a JSON backup) is
  restricted to Administrators, since it now writes to a shared database
  rather than one browser's local storage.
- A few decorative fields carried over from the original design mockup
  (attachment upload on the fault report, assigned technician / workshop bay
  on in-house repairs) are not wired to persistence, matching the source
  design's own scope.
