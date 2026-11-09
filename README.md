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
4. **Sign-up settings.** Anyone can create an account from the sign-in box
   ("Create an account"). In Supabase:
   - **Authentication → Sign In / Providers → Email**: keep *Allow new users to sign up*
     on. *Confirm email* on = new users must click an emailed link first.
   - **Authentication → URL Configuration**: set **Site URL** to the live Vercel URL and
     add both `https://<your-app>.vercel.app/**` and `http://localhost:5173/**` to
     **Redirect URLs**, so confirmation links open the app.
   You can still add users by hand: **Authentication → Users → Add user** (tick
   **Auto Confirm User**).

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
