# WordVault

A personal English dictionary. Look up words (from the free
[Free Dictionary API](https://dictionaryapi.dev/)) and save them to your own
categories. Saved words sync through Supabase, so they show up on every device.

## First-time setup

1. **Install Node.js** (v20 or newer), then in this folder run:
   ```bash
   npm install
   ```
2. **Supabase keys.** `.env.local` holds your project URL and publishable key
   (Supabase → Project Settings → API). See `.env.example` for the format.
3. **Create the tables.** In Supabase open **SQL Editor → New query**, paste all of
   `supabase/schema.sql`, and press **Run**.
4. **Create your login.** In Supabase open **Authentication → Users → Add user →
   Create new user**, enter your email and a password, and tick
   **Auto Confirm User**. (The app has no sign-up page on purpose: only you can log in.)

## Run

```bash
npm run dev
```
Open http://localhost:5173. Searching works without signing in; saving needs sign-in.

## Build

```bash
npm run build
```
Output goes to `dist/`.

## Back up your data

Your words already live in Supabase. For an extra copy you keep yourself:
**Backup tab → Export to JSON**. To restore, **Backup tab → Choose backup file…**.
Import merges into what you have and never deletes anything.
