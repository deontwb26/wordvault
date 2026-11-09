# Project Brief: Personal English Dictionary ("WordVault")

> Paste this whole file into Claude Code as your first message, OR save it as `PROJECT_BRIEF.md` in an empty project folder and tell Claude Code: "Read PROJECT_BRIEF.md and start Phase 1 in plan mode."

---

## What I want
A personal English dictionary web app I can use on desktop and phone (installable PWA). Two jobs:
1. **Look up words** – meaning, part of speech, pronunciation, example sentences, synonyms/antonyms.
2. **Build my own vocabulary list** – save words and tag them with **my own categories** (e.g. "Data Analytics", "Public Speaking", "Writing"). I create, rename, delete categories myself. A word can belong to more than one category.

English only for now. I am a data analyst, not a front-end developer – keep the code simple and well commented.

## Data source – DO NOT generate dictionary content
- Use the free, keyless **Free Dictionary API**: `GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>`
- Never hard-code, invent, or generate definitions/examples. All dictionary content comes from the API.
- Handle "word not found" (API returns a message object, not an array) and network errors gracefully.
- Many senses have no example sentence. Show the API example when it exists; otherwise show nothing (no AI-made examples).
- Cache every successful lookup in IndexedDB so repeat lookups and saved words work offline.

## Tech stack (keep it minimal)
- Vite + React + TypeScript
- Tailwind CSS for styling
- **Dexie.js** (IndexedDB wrapper) for local storage – no backend, no login, no database server
- `vite-plugin-pwa` for installable/offline support
- No other libraries unless you ask me first and explain why

## Data model (IndexedDB via Dexie)
- `savedWords`: id, word (lowercase, unique), savedAt, personalNote (my own example sentence or memory hook), categoryIds[]
- `categories`: id, name (unique), color, createdAt
- `lookupCache`: word (key), apiResponse (raw JSON), fetchedAt

## Features

### Phase 1 – MVP (build this first, then stop for my review)
1. Search box → shows definitions grouped by part of speech, phonetics, audio play button (if audio URL exists), examples, synonyms/antonyms. Clicking a synonym searches it.
2. "Save" button on a result → pick one or more categories (or create a new one inline) + optional personal note.
3. "My Words" page: list saved words, filter by category, search within saved words, sort by date saved or A–Z.
4. Category management: create / rename / delete / recolor. Deleting a category does NOT delete words, just removes the tag.
5. Export all my data to JSON and import it back (this is my backup and how I move data between devices).

### Phase 2 – only when I ask
- Recent search history
- Export saved words of a category to CSV
- Simple review mode (flashcards from a chosen category)
- PWA install + offline polish
- Deploy to GitHub Pages or Vercel

## How to work (to keep token usage low)
- Start in **plan mode**: show me the file structure and component list before writing code. Wait for my OK.
- Scaffold with the official command (`npm create vite@latest`) rather than writing boilerplate by hand.
- Build one feature at a time; run `npm run build` after each to catch errors.
- Keep components small; don't rewrite whole files when a small edit will do.
- Don't read `node_modules`, lock files, or build output.
- After Phase 1, create a short `CLAUDE.md` describing the stack, data model, and commands so future sessions don't need to re-explore the code.
- Write a short `README.md` with: how to install, run (`npm run dev`), build, and back up my data.

## Done = 
I can run `npm run dev`, search "ambiguous", save it under "Writing" and "Public Speaking" with a note, see it in My Words filtered by "Writing", export to JSON, clear browser data, import, and get everything back.
