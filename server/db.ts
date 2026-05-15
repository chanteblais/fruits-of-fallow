import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const IMG_DIR = path.join(DATA_DIR, 'images')

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(IMG_DIR, { recursive: true })

export const db = new Database(path.join(DATA_DIR, 'tarot.db'))
export { IMG_DIR }

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    card_id TEXT NOT NULL,
    card_name TEXT,
    suit TEXT,
    orientation TEXT DEFAULT 'upright',
    primary_themes TEXT DEFAULT '',
    traditional_meaning TEXT DEFAULT '',
    personal_reflection TEXT DEFAULT '',
    how_appeared TEXT DEFAULT '',
    quotes_insights TEXT DEFAULT '',
    emerging_symbols TEXT DEFAULT '[]',
    visual_direction TEXT DEFAULT '',
    psychological_themes TEXT DEFAULT '[]',
    guidebook_notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    personal_meanings TEXT DEFAULT '[]',
    symbolism TEXT DEFAULT '[]',
    archetype_notes TEXT DEFAULT '[]',
    visual_notes TEXT DEFAULT '',
    associated_symbols TEXT DEFAULT '[]',
    guidebook_drafts TEXT DEFAULT '[]',
    last_updated TEXT
  );

  CREATE TABLE IF NOT EXISTS symbols (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    meaning TEXT DEFAULT '',
    emotional_associations TEXT DEFAULT '[]',
    connected_cards TEXT DEFAULT '[]',
    appearances TEXT DEFAULT '[]',
    evolution TEXT DEFAULT '[]',
    related_symbols TEXT DEFAULT '[]',
    journal_backlinks TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    related_cards TEXT DEFAULT '[]',
    occurrences TEXT DEFAULT '[]',
    emotional_patterns TEXT DEFAULT '[]',
    evolved_meanings TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    ref_type TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    caption TEXT DEFAULT '',
    iteration TEXT DEFAULT '',
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS entry_analysis (
    id TEXT PRIMARY KEY,
    entry_id TEXT UNIQUE NOT NULL,
    card_id TEXT NOT NULL,
    living_arcana_json TEXT DEFAULT '{}',
    weaving_json TEXT DEFAULT '{}',
    cross_links_json TEXT DEFAULT '{}',
    not_archived_json TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS weaving_threads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    focus TEXT DEFAULT '',
    body TEXT NOT NULL,
    threads_json TEXT DEFAULT '[]',
    entry_ids TEXT DEFAULT '[]',
    cards_observed TEXT DEFAULT '[]',
    symbols_observed TEXT DEFAULT '[]',
    entry_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS style_bible (
    id INTEGER PRIMARY KEY DEFAULT 1,
    palette TEXT DEFAULT '[{"hex":"#0a0a16","label":"Deep Void"},{"hex":"#c9a84c","label":"Ink Gold"},{"hex":"#e2d9c8","label":"Vellum Cream"}]',
    textures TEXT DEFAULT '',
    lighting TEXT DEFAULT '',
    composition TEXT DEFAULT '',
    typography TEXT DEFAULT '',
    borders TEXT DEFAULT '',
    placement TEXT DEFAULT '',
    art_refs TEXT DEFAULT '[]',
    motifs TEXT DEFAULT '[]',
    drift_notes TEXT DEFAULT '[]'
  );
`)

// ─── Migrate existing entries table to new field schema ───────────────────────

const entryColumns = (db.prepare('PRAGMA table_info(entries)').all() as { name: string }[]).map(c => c.name)

if (!entryColumns.includes('primary_themes')) {
  const newCols: [string, string][] = [
    ['primary_themes',     "TEXT DEFAULT ''"],
    ['traditional_meaning',"TEXT DEFAULT ''"],
    ['quotes_insights',    "TEXT DEFAULT ''"],
    ['emerging_symbols',   "TEXT DEFAULT '[]'"],
    ['visual_direction',   "TEXT DEFAULT ''"],
    ['psychological_themes',"TEXT DEFAULT '[]'"],
  ]
  for (const [col, def] of newCols) {
    db.exec(`ALTER TABLE entries ADD COLUMN ${col} ${def}`)
  }
  db.exec(`
    UPDATE entries SET
      primary_themes      = COALESCE(keywords, ''),
      traditional_meaning = COALESCE(traditional_meanings, ''),
      quotes_insights     = COALESCE(quotes, ''),
      emerging_symbols    = COALESCE(symbols, '[]'),
      visual_direction    = CASE
        WHEN COALESCE(visual_concepts,'') != '' AND COALESCE(image_refs,'') != ''
          THEN visual_concepts || char(10) || char(10) || image_refs
        ELSE COALESCE(visual_concepts,'') || COALESCE(image_refs,'')
      END,
      psychological_themes = COALESCE(emotional_themes, '[]')
  `)
}

const symbolColumns = (db.prepare('PRAGMA table_info(symbols)').all() as { name: string }[]).map(c => c.name)
const symbolNewCols: [string, string][] = [
  ['poetic_essence', "TEXT DEFAULT ''"],
  ['voice', "TEXT DEFAULT ''"],
  ['elemental_quality', "TEXT DEFAULT ''"],
  ['season', "TEXT DEFAULT ''"],
  ['recurring_contexts', "TEXT DEFAULT ''"],
  ['field_notes', "TEXT DEFAULT '[]'"],
]

for (const [col, def] of symbolNewCols) {
  if (!symbolColumns.includes(col)) {
    db.exec(`ALTER TABLE symbols ADD COLUMN ${col} ${def}`)
  }
}

// ─── Seed cards (78 rows, idempotent) ────────────────────────────────────────

const CARDS_78 = [
  { id: 'M00', suit: 'major', num: 0 }, { id: 'M01', suit: 'major', num: 1 },
  { id: 'M02', suit: 'major', num: 2 }, { id: 'M03', suit: 'major', num: 3 },
  { id: 'M04', suit: 'major', num: 4 }, { id: 'M05', suit: 'major', num: 5 },
  { id: 'M06', suit: 'major', num: 6 }, { id: 'M07', suit: 'major', num: 7 },
  { id: 'M08', suit: 'major', num: 8 }, { id: 'M09', suit: 'major', num: 9 },
  { id: 'M10', suit: 'major', num: 10 }, { id: 'M11', suit: 'major', num: 11 },
  { id: 'M12', suit: 'major', num: 12 }, { id: 'M13', suit: 'major', num: 13 },
  { id: 'M14', suit: 'major', num: 14 }, { id: 'M15', suit: 'major', num: 15 },
  { id: 'M16', suit: 'major', num: 16 }, { id: 'M17', suit: 'major', num: 17 },
  { id: 'M18', suit: 'major', num: 18 }, { id: 'M19', suit: 'major', num: 19 },
  { id: 'M20', suit: 'major', num: 20 }, { id: 'M21', suit: 'major', num: 21 },
  ...['W','C','S','P'].flatMap(suit => {
    const suitName = { W: 'wands', C: 'cups', S: 'swords', P: 'pentacles' }[suit]!
    return [
      ...Array.from({ length: 10 }, (_, i) => ({ id: `${suit}${String(i+1).padStart(2,'0')}`, suit: suitName, num: i+1 })),
      { id: `${suit}Pa`, suit: suitName, num: 11 },
      { id: `${suit}Kn`, suit: suitName, num: 12 },
      { id: `${suit}Qu`, suit: suitName, num: 13 },
      { id: `${suit}Ki`, suit: suitName, num: 14 },
    ]
  })
]

const insertCard = db.prepare(`INSERT OR IGNORE INTO cards (id) VALUES (?)`)
const seedCards = db.transaction(() => {
  for (const c of CARDS_78) insertCard.run(c.id)
})
seedCards()

// ─── Seed symbols ─────────────────────────────────────────────────────────────

const DEFAULT_SYMBOLS = [
  'lantern','eye','moon','serpent','threshold','mirror','hands','staircase',
  'candle','curtain','fabric','shrimp','key','star','window','water','fire',
  'crown','sword','tower','rose','wheel','sun','spider','bird','forest'
]

const insertSymbol = db.prepare(`INSERT OR IGNORE INTO symbols (id, name) VALUES (?, ?)`)
const seedSymbols = db.transaction(() => {
  for (const s of DEFAULT_SYMBOLS) {
    insertSymbol.run(s, s.charAt(0).toUpperCase() + s.slice(1))
  }
})
seedSymbols()

// ─── Seed themes ──────────────────────────────────────────────────────────────

const DEFAULT_THEMES = [
  'Obsession & Temperance','Thresholds & Initiation','Belonging',
  'Creative Fire','Stewardship','Identity Formation','Emergence',
  'Illusion','Grief','Attunement','Community','Shadow Work',
  'Transformation','Intuition','Power & Surrender'
]

const insertTheme = db.prepare(`INSERT OR IGNORE INTO themes (id, name) VALUES (?, ?)`)
const seedThemes = db.transaction(() => {
  for (const t of DEFAULT_THEMES) insertTheme.run(t, t)
})
seedThemes()

// ─── Seed style bible (single row) ────────────────────────────────────────────

db.prepare(`INSERT OR IGNORE INTO style_bible (id) VALUES (1)`).run()
