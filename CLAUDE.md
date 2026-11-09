# WordVault – notes for Claude

Personal English dictionary web app. Owner is a data analyst: keep code simple and commented.
Full spec: PROJECT_BRIEF.md. Phase 1 is done; Phase 2 items only when asked.

## Stack
Vite + React 19 + TypeScript, Tailwind v4 (`@tailwindcss/vite`), Dexie, `@supabase/supabase-js`.
Ask before adding any other library. No router: tabs are state in `src/App.tsx`.

## Data
- Dictionary content comes ONLY from `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`.
  Never generate definitions or examples. Not-found = 404 with a message object, not an array.
- **Datamuse** (`src/api/datamuse.ts`, free, keyless, `https://api.datamuse.com/words`): search-box
  suggestions (`sp=prefix*`), typo fixes (`sl=` sound-alike, filtered by word frequency `md=f`),
  and extra synonyms/antonyms (`rel_syn`, `rel_ant`) merged into the RelatedWords panel. Not cached.
- **Pronunciation** (`src/utils/pronunciation.ts`): skips fragment IPA like "/-əsəs/"; Listen tries API mp3 →
  Wikimedia original (`Special:FilePath/En-<accent>-<word>.ogg`; the API's audio host often 502s) →
  browser speechSynthesis.
- **Dexie (IndexedDB)** `src/db.ts`: `lookupCache` only (word, apiResponse, fetchedAt). Checked before the API.
- **Supabase** (`supabase/schema.sql`, RLS by `user_id = auth.uid()`):
  - `categories` (id, user_id, name unique per user case-insensitive, color, created_at)
  - `saved_words` (id, user_id, word lowercase unique per user, personal_note, saved_at)
  - `saved_word_categories` (word_id, category_id, user_id) – cascade deletes, so deleting a category keeps words
- All Supabase calls live in `src/data/store.ts`. Shared state (session, words, categories, `refresh()`)
  in `src/data/VaultContext.tsx`; call `refresh()` after writes.
- Auth: email + password; the user is created in the Supabase dashboard (no sign-up UI).
- Backup JSON (`src/utils/backup.ts`): `{app:'wordvault', version:1, categories, savedWords, lookupCache}`.
  Import merges by category name and word.

## Layout
`src/api/dictionary.ts` lookup · `src/pages/*` one per tab · `src/components/*` small pieces.

## Commands
`npm run dev` (port 5173) · `npm run build` (run after each change) · `npm run lint`.
Env: `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Gotcha
The desktop app's preview launcher can't start npm inside ~/Documents (macOS privacy).
Start `npx vite --port 5173` from Bash in the background, then open the `wordvault` preview (URL only).
