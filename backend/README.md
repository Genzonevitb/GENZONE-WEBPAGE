# GenZone Admin Dashboard

Private admin panel for managing the GenZone club website content.

## Tech Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Database + Storage)
- react-router-dom v7
- browser-image-compression
- sonner (toasts)
- Radix UI / lucide-react

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
```

### 3. Run database migrations
See `../database/README.md` — run SQL files in Supabase SQL Editor first.

### 4. Run dev server
```bash
npm run dev
# Opens at http://localhost:5173
```

### 5. Build for production
```bash
npm run build
```

## Admin Access
- No self-signup. Admins are created manually in Supabase Auth.
- Your email must also be in the `admins` table.
- See `../database/README.md` for instructions.

## Pages

| Route | Purpose |
|-------|---------|
| /login | Admin login |
| / | Dashboard with counts |
| /events | Manage events + posters |
| /gallery | Upload + manage gallery photos |
| /panel | Manage panel members + portraits |
| /feedback | View feedback form submissions |
| /settings | Edit contact info, socials, tagline |
