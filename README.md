# GenZone — Monorepo

College club website with admin dashboard.

## Structure

| Folder | What it is |
|--------|-----------|
| `/` (root) | Public GenZone website (React 19 + TanStack Start) |
| `backend/` | Private admin dashboard (Vite + React + Supabase) |
| `database/` | Supabase SQL migration files |

## Quick Start

### 1. Set up database

See [database/README.md](./database/README.md) — run SQL files in Supabase SQL Editor first.

### 2. Run the public site

```bash
npm install
npm run dev        # http://localhost:3000
```

### 3. Run the admin dashboard

```bash
cd backend
npm install
npm run dev        # http://localhost:5173
```

## Connecting the site to the database

See [backend/docs/FRONTEND_INTEGRATION.md](./backend/docs/FRONTEND_INTEGRATION.md).
