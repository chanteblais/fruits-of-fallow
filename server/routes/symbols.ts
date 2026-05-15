import { Router } from 'express'
import { db } from '../db'

const router = Router()

function parseSymbol(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    meaning: row.meaning || '',
    poeticEssence: row.poetic_essence || '',
    voice: row.voice || '',
    elementalQuality: row.elemental_quality || '',
    season: row.season || '',
    recurringContexts: row.recurring_contexts || '',
    emotionalAssociations: JSON.parse(row.emotional_associations as string || '[]'),
    connectedCards: JSON.parse(row.connected_cards as string || '[]'),
    appearances: JSON.parse(row.appearances as string || '[]'),
    evolution: JSON.parse(row.evolution as string || '[]'),
    fieldNotes: JSON.parse(row.field_notes as string || '[]'),
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
      appearances, evolution, related_symbols, journal_backlinks, poetic_essence,
      voice, elemental_quality, season, recurring_contexts, field_notes)
    VALUES (@id, @name, @meaning, @emotionalAssociations, @connectedCards,
      @appearances, @evolution, @relatedSymbols, @journalBacklinks, @poeticEssence,
      @voice, @elementalQuality, @season, @recurringContexts, @fieldNotes)
    ON CONFLICT(id) DO UPDATE SET
      name = @name, meaning = @meaning,
      emotional_associations = @emotionalAssociations,
      connected_cards = @connectedCards, appearances = @appearances,
      evolution = @evolution, related_symbols = @relatedSymbols,
      journal_backlinks = @journalBacklinks, poetic_essence = @poeticEssence,
      voice = @voice, elemental_quality = @elementalQuality, season = @season,
      recurring_contexts = @recurringContexts, field_notes = @fieldNotes
  `).run({
    id: req.params.id,
    name: s.name || req.params.id,
    meaning: s.meaning || '',
    poeticEssence: s.poeticEssence || '',
    voice: s.voice || '',
    elementalQuality: s.elementalQuality || '',
    season: s.season || '',
    recurringContexts: s.recurringContexts || '',
    emotionalAssociations: JSON.stringify(s.emotionalAssociations || []),
    connectedCards: JSON.stringify(s.connectedCards || []),
    appearances: JSON.stringify(s.appearances || []),
    evolution: JSON.stringify(s.evolution || []),
    fieldNotes: JSON.stringify(s.fieldNotes || []),
    relatedSymbols: JSON.stringify(s.relatedSymbols || []),
    journalBacklinks: JSON.stringify(s.journalBacklinks || []),
  })
  res.json({ ok: true })
})

export default router
