import { Router } from 'express'
import { db } from '../db'

const router = Router()

router.get('/', (_req, res) => {
  const entries = db.prepare('SELECT * FROM entries ORDER BY date DESC').all()
  const cards = db.prepare('SELECT * FROM cards').all()
  const symbols = db.prepare('SELECT * FROM symbols').all()
  const themes = db.prepare('SELECT * FROM themes').all()
  const images = db.prepare('SELECT * FROM images').all()
  const styleBible = db.prepare('SELECT * FROM style_bible WHERE id = 1').get()

  res.json({ entries, cards, symbols, themes, images, styleBible, exportedAt: new Date().toISOString() })
})

router.post('/import', (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid data' })

  const importAll = db.transaction(() => {
    if (Array.isArray(data.entries)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO entries (id, date, card_id, card_name, suit, orientation, keywords,
          traditional_meanings, personal_reflection, major_insight, how_appeared,
          emotional_themes, symbols, quotes, visual_concepts, image_refs,
          related_cards, guidebook_notes, created_at, updated_at)
        VALUES (@id, @date, @card_id, @card_name, @suit, @orientation, @keywords,
          @traditional_meanings, @personal_reflection, @major_insight, @how_appeared,
          @emotional_themes, @symbols, @quotes, @visual_concepts, @image_refs,
          @related_cards, @guidebook_notes, @created_at, @updated_at)
      `)
      for (const e of data.entries) stmt.run(e)
    }
    if (Array.isArray(data.cards)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO cards (id, personal_meanings, symbolism, archetype_notes,
          visual_notes, associated_symbols, guidebook_drafts, last_updated)
        VALUES (@id, @personal_meanings, @symbolism, @archetype_notes,
          @visual_notes, @associated_symbols, @guidebook_drafts, @last_updated)
      `)
      for (const c of data.cards) stmt.run(c)
    }
    if (Array.isArray(data.symbols)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO symbols (id, name, meaning, emotional_associations, connected_cards,
          appearances, evolution, related_symbols, journal_backlinks)
        VALUES (@id, @name, @meaning, @emotional_associations, @connected_cards,
          @appearances, @evolution, @related_symbols, @journal_backlinks)
      `)
      for (const s of data.symbols) stmt.run(s)
    }
    if (Array.isArray(data.themes)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO themes (id, name, description, related_cards, occurrences, emotional_patterns, evolved_meanings)
        VALUES (@id, @name, @description, @related_cards, @occurrences, @emotional_patterns, @evolved_meanings)
      `)
      for (const t of data.themes) stmt.run(t)
    }
  })

  importAll()
  res.json({ ok: true })
})

export default router
