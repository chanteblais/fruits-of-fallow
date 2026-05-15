# The Inner Atlas — Tarot Observatory

A personal tarot practice system. Daily journal, card library, symbol lexicon, style bible, theme tracker, study system, and deck gallery — all local, all yours.

## Requirements

- **Node 22** (Homebrew install at `/opt/homebrew/Cellar/node@22`)
- Run once to link it: `brew link node@22 --force`

## Quick start

```bash
brew link node@22 --force   # one-time setup
npm install
npm run dev
```

Then open **http://localhost:5173**

The API server runs at **http://localhost:3001**. Both start together with `npm run dev`.

## Data

All data is stored locally in `data/` (git-ignored):
- `data/tarot.db` — SQLite database (journal entries, card notes, symbols, themes)
- `data/images/` — uploaded card artwork saved as real files

## Export / Import

Use the **↓ Export** / **↑ Import** buttons in the sidebar to download/restore a full JSON backup.

## Project structure

```
server/           Express + better-sqlite3 API (port 3001)
  db.ts           Schema, seeding, DB singleton
  routes/         entries, cards, images, symbols, themes, export

src/
  lib/            cards.ts (78-card constants), utils.ts, api.ts
  types/          TypeScript interfaces
  styles/         globals.css (full design system)
  contexts/       ToastContext
  components/     Nav
  pages/
    Home.tsx          ✓ fully implemented
    Journal/          ✓ list, entry form, entry detail
    CardLibrary.tsx   → next pass
    SymbolLexicon.tsx → next pass
    StyleBible.tsx    → next pass
    ThemeTracker.tsx  → next pass
    StudySystem.tsx   → next pass
    DeckGallery.tsx   → next pass
```
