# GenZone — Database Setup Guide

This directory contains everything needed to initialise the Supabase backend for the GenZone college club website.

---

## Files

| # | File | Purpose |
|---|------|---------|
| 1 | `01_schema.sql` | Creates all 6 tables with correct types, constraints, and defaults |
| 2 | `02_policies.sql` | Enables RLS and sets up all access control policies |
| 3 | `03_storage.sql` | Creates the 3 image storage buckets and their object policies |
| 4 | `04_seed.sql` | Inserts placeholder data matching the frontend static content |

---

## Step-by-Step Setup

### 1 — Open the Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and open your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **+ New query** to open a blank query window.

---

### 2 — Run the SQL files in order

> **Important:** You must run the files in the numbered order. Each file depends on the previous one.

**Run `01_schema.sql` first:**

1. Open `01_schema.sql` from this directory, copy its entire contents.
2. Paste into the SQL Editor query window.
3. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
4. Confirm you see a success message with no errors.

**Run `02_policies.sql` second:**

1. Clear the query window (or open a new one).
2. Copy and paste the full contents of `02_policies.sql`.
3. Click **Run**.

**Run `03_storage.sql` third:**

1. Clear the query window (or open a new one).
2. Copy and paste the full contents of `03_storage.sql`.
3. Click **Run**.

> This creates three storage buckets: **gallery**, **portraits**, and **events**.  
> You can verify them under **Storage** in the Supabase sidebar.

**Run `04_seed.sql` last:**

1. Clear the query window (or open a new one).
2. Copy and paste the full contents of `04_seed.sql`.
3. Click **Run**.

> This populates placeholder events, panel members, and site settings.  
> You can safely re-run `04_seed.sql` — the settings insert is idempotent.

---

### 3 — Create an Admin User in Supabase Auth

The CMS is protected by checking whether the authenticated user's email exists in the `admins` table.

1. In the Supabase sidebar, go to **Authentication → Users**.
2. Click **Invite user**.
3. Enter the email address of the admin (e.g. your own email).
4. Click **Send invite**. The invited user will receive a magic-link email to set their password.

---

### 4 — Disable Public Signups

Prevent random users from creating accounts on your project:

1. Go to **Authentication → Settings** in the Supabase sidebar.
2. Scroll to the **User Signups** section.
3. Toggle **Enable new user signups** to **OFF**.
4. Click **Save**.

> New users can still be added via the **Invite user** flow in step 3 above.

---

### 5 — Grant Admin Privileges

After creating a user in Supabase Auth, you must add their email to the `admins` table:

1. Open the **SQL Editor**.
2. Run the following query, substituting your email:

```sql
INSERT INTO admins (email) VALUES ('your@email.com');
```

3. That user can now sign in to the CMS and manage all content.

> To revoke access, delete the row:
> ```sql
> DELETE FROM admins WHERE email = 'their@email.com';
> ```

---

### 6 — Storage Buckets

The three storage buckets are created automatically when you run `03_storage.sql`:

| Bucket | Used For | Max File Size | Accepted Types |
|--------|----------|---------------|----------------|
| `gallery` | Event / memory photos | 5 MB | WebP, JPEG, PNG |
| `portraits` | Panel member headshots | 5 MB | WebP, JPEG, PNG |
| `events` | Event cover images | 5 MB | WebP, JPEG, PNG |

All buckets are **public** — anyone can read (download) images.  
Only admins (email in `admins` table) can upload, replace, or delete objects.

You can verify the buckets exist by clicking **Storage** in the Supabase sidebar after running `03_storage.sql`.

---

## Table Overview

```
admins          — email (PK) — admin whitelist, managed via SQL only
events          — id, title, description, event_date, venue, category, accent, image, is_published
panel_members   — id, name, role, accent, portrait, sort_order
gallery         — id, caption, category, image, thumb, event_id (FK→events), tall, sort_order
feedback        — id, kind, name, email, message — write-only for public
settings        — key (PK), value — site-wide config (contact, socials, tagline)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `relation "admins" does not exist` | Run `01_schema.sql` first |
| `policy already exists` | Safe to ignore — or run `DROP POLICY` before re-running `02_policies.sql` |
| `duplicate key value violates unique constraint` on buckets | Bucket already created — safe to ignore |
| Admin can't access CMS | Make sure their email is in the `admins` table AND they have a Supabase Auth account |
| Images not uploading | Check that the storage bucket policies from `03_storage.sql` were applied successfully |
