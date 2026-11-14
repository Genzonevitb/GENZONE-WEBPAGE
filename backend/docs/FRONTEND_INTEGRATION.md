# Frontend Integration Guide

How to connect the GenZone public website (`/src`) to live Supabase data.

## Overview

Currently, `frontend/src/content/genzone.ts` exports hardcoded arrays for events, gallery photos, panel members, and settings. This document describes step-by-step how to replace that hardcoded data with live queries against the Supabase backend that the admin dashboard manages.

After following these steps, the public site will automatically reflect any changes made through the admin dashboard — no code changes required for content updates.

---

## Step 1: Install `@supabase/supabase-js` in the frontend

From the **repository root** (the public site):

```bash
npm install @supabase/supabase-js
```

Or with bun:

```bash
bun add @supabase/supabase-js
```

---

## Step 2: Add environment variables

Create a `.env.local` file in the **frontend root** (next to the root `package.json`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> [!NOTE]
> TanStack Start uses the `VITE_` prefix for client-side environment variables. These values are safe to expose in the browser — Supabase Row Level Security (RLS) policies control what the anon key can actually read or write.

> [!CAUTION]
> Never commit `.env.local` to version control. It is already listed in `.gitignore`.

---

## Step 3: Create `src/lib/supabase.ts` in the frontend

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Step 4: Type definitions

Create `src/types/database.ts` with TypeScript interfaces that mirror the Supabase schema:

```typescript
export type Accent = 'cyan' | 'pink' | 'yellow'

export interface Event {
  id: string
  title: string
  description: string | null
  event_date: string | null
  venue: string | null
  category: string | null
  accent: Accent
  image_url: string | null
  image_path: string | null
  is_published: boolean
  created_at: string
}

export interface PanelMember {
  id: string
  name: string
  role: string
  accent: Accent
  portrait_url: string | null
  portrait_path: string | null
  sort_order: number
  created_at: string
}

export interface GalleryItem {
  id: string
  caption: string | null
  category: string | null
  image_url: string
  image_path: string
  thumb_url: string | null
  thumb_path: string | null
  event_id: string | null
  sort_order: number
  tall: boolean
  created_at: string
}

export interface FeedbackEntry {
  id: string
  kind: 'Idea' | 'Feedback' | 'Collab' | 'Other'
  name: string
  email: string | null
  message: string
  created_at: string
}

export interface Setting {
  key: string
  value: string | null
}
```

---

## Step 5: Query helpers (copy-paste ready)

Create `src/lib/queries.ts` and add these functions:

### Fetch published events

```typescript
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types/database'

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
```

### Fetch panel members

```typescript
import type { PanelMember } from '@/types/database'

export async function getPanelMembers(): Promise<PanelMember[]> {
  const { data, error } = await supabase
    .from('panel_members')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}
```

### Fetch gallery

```typescript
import type { GalleryItem } from '@/types/database'

export async function getGallery(category?: string): Promise<GalleryItem[]> {
  let query = supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
```

### Fetch site settings

```typescript
export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')

  if (error) throw error
  return Object.fromEntries((data ?? []).map(s => [s.key, s.value ?? '']))
}
```

### Submit feedback (from the contact form)

```typescript
export async function submitFeedback(payload: {
  kind: string
  name: string
  email?: string
  message: string
}): Promise<void> {
  const { error } = await supabase
    .from('feedback')
    .insert([payload])

  if (error) throw error
}
```

---

## Step 6: Update components

Replace static imports from `genzone.ts` with the query functions above:

| File | What to change |
|------|----------------|
| `src/content/genzone.ts` | Keep as a fallback/reference — queries above supersede it |
| `src/components/genzone/Sections.tsx` — Events section | Replace static `events` import with `getEvents()` in a `useEffect` or TanStack Query hook |
| `src/components/genzone/Sections.tsx` — Gallery section | Replace static `memories` with `getGallery()` |
| `src/components/genzone/Sections.tsx` — Panel section | Replace static `panel` with `getPanelMembers()` |
| `src/components/genzone/Feedback.tsx` — form submit | Replace the `// TODO` comment with a call to `submitFeedback()` |
| `src/components/genzone/Nav.tsx` | Pull `contact` info from `getSettings()` |
| `src/components/genzone/Feedback.tsx` — Footer socials | Pull social links from `getSettings()` |

---

## Step 7: Using TanStack Query (recommended)

`@tanstack/react-query` is already installed in the frontend. Wrap data fetching with `useQuery` for automatic caching, background refetching, and loading states:

```typescript
import { useQuery } from '@tanstack/react-query'
import { getEvents } from '@/lib/queries'

export function EventsSection() {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  })

  if (isLoading) return <div>Loading…</div>
  if (error) return <div>Failed to load events.</div>

  return (
    // ... render events
  )
}
```

Apply the same pattern to `getPanelMembers`, `getGallery`, and `getSettings`.

---

## Step 8: Images

All `image_url` / `portrait_url` / `thumb_url` values stored in Supabase are **direct public CDN URLs**. They work in `<img>` tags without any special handling:

```tsx
<img src={event.image_url ?? '/placeholder.png'} alt={event.title} />
```

The admin dashboard handles compression and upload — the frontend simply consumes the resulting URL.

---

## Important Notes

> [!IMPORTANT]
> Never import anything from `backend/` into `src/` (or vice versa). They are completely separate apps.

> [!NOTE]
> The **anon key** is intentionally public-facing. Supabase Row Level Security (RLS) policies on each table enforce what the anon key can and cannot do. The admin dashboard uses a **service role key** (server-side only) for privileged writes.

> [!TIP]
> After making changes, run `npm run build` in the frontend root to catch TypeScript errors before deploying.
