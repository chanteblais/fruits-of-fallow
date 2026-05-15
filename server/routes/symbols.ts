import { Router } from 'express'
import { db } from '../db'

const router = Router()

function parseSymbol(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    meaning: row.meaning || '',
    emotionalAssociations: JSON.parse(row.emotional_associations as string || '[]'),
    connectedCards: JSON.parse(row.connected_cards as string || '[]'),
    appearances: JSON.parse(row.appearances as string || '[]'),
    evolution: JSON.parse(row.evolution as string || '[]'),
    relatedSymbols: JSON.parse(row.related_symbols as string || '[]'),
    journalBacklinks: JSON.parse(row.journal_backlinks as string || '[]'),
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM symbols ORDER BY name ASC').all() as Record<string, unknown>[]
  res.json(rows.map(parseSymbol))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM symbols WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(parseSymbol(row))
})

router.put('/:id', (req, res) => {
  const s = req.body
  db.prepare(`
    INSERT INTO symbols (id, name, meaning, emotional_associations, connected_cards,
      appearances, evolution, related_symbols, journal_backlinks)
    VALUES (@id, @name, @meaning, @emotionalAssociations, @connectedCards,
      @appearances, @evolution, @relatedSymbols, @journalBacklinks)
    ON CONFLICT(id) DO UPDATE SET
      name = @name, meaning = @meaning,
      emotional_associations = @emotionalAssociations,
      connected_cards = @connectedCards, appearances = @appearances,
      evolution = @evolution, related_symbols = @relatedSymbols,
      journal_backlinks = @journalBacklinks
  `).run({
    id: req.params.id,
    name: s.name || req.params.id,
    meaning: s.meaning || '',
    emotionalAssociations: JSON.stringify(s.emotionalAssociations || []),
    connectedCards: JSON.stringify(s.connectedCards || []),
    appearances: JSON.stringify(s.appearances || []),
    evolution: JSON.stringify(s.evolution || []),
    relatedSymbols: JSON.stringify(s.relatedSymbols || []),
    journalBacklinks: JSON.stringify(s.journalBacklinks || []),
  })
  res.json({ ok: true })
})

export default router
