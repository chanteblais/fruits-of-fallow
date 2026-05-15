import { Router } from 'express'
import { db } from '../db'

const router = Router()

function parseTheme(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    relatedCards: JSON.parse(row.related_cards as string || '[]'),
    occurrences: JSON.parse(row.occurrences as string || '[]'),
    emotionalPatterns: JSON.parse(row.emotional_patterns as string || '[]'),
    evolvedMeanings: JSON.parse(row.evolved_meanings as string || '[]'),
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM themes ORDER BY name ASC').all() as Record<string, unknown>[]
  res.json(rows.map(parseTheme))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM themes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(parseTheme(row))
})

router.put('/:id', (req, res) => {
  const t = req.body
  db.prepare(`
    INSERT INTO themes (id, name, description, related_cards, occurrences, emotional_patterns, evolved_meanings)
    VALUES (@id, @name, @description, @relatedCards, @occurrences, @emotionalPatterns, @evolvedMeanings)
    ON CONFLICT(id) DO UPDATE SET
      name = @name, description = @description, related_cards = @relatedCards,
      occurrences = @occurrences, emotional_patterns = @emotionalPatterns,
      evolved_meanings = @evolvedMeanings
  `).run({
    id: req.params.id,
    name: t.name || req.params.id,
    description: t.description || '',
    relatedCards: JSON.stringify(t.relatedCards || []),
    occurrences: JSON.stringify(t.occurrences || []),
    emotionalPatterns: JSON.stringify(t.emotionalPatterns || []),
    evolvedMeanings: JSON.stringify(t.evolvedMeanings || []),
  })
  res.json({ ok: true })
})

export default router
