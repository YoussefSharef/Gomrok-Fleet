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

## Notes

- Import (replacing the whole equipment register from a JSON backup) is
  restricted to Administrators, since it now writes to a shared database
  rather than one browser's local storage.
- A few decorative fields carried over from the original design mockup
  (attachment upload on the fault report, assigned technician / workshop bay
  on in-house repairs) are not wired to persistence, matching the source
  design's own scope.
