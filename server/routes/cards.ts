import { Router } from 'express'
import { db } from '../db'

const router = Router()

function parseCard(row: Record<string, unknown>) {
  return {
    id: row.id,
    personalMeanings: JSON.parse(row.personal_meanings as string || '[]'),
    symbolism: JSON.parse(row.symbolism as string || '[]'),
    archetypeNotes: JSON.parse(row.archetype_notes as string || '[]'),
    visualNotes: row.visual_notes || '',
    associatedSymbols: JSON.parse(row.associated_symbols as string || '[]'),
    guidebookDrafts: JSON.parse(row.guidebook_drafts as string || '[]'),
    lastUpdated: row.last_updated || null,
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM cards').all() as Record<string, unknown>[]
  res.json(rows.map(parseCard))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(parseCard(row))
})

router.put('/:id', (req, res) => {
  const c = req.body
  db.prepare(`
    UPDATE cards SET
      personal_meanings = @personalMeanings,
      symbolism = @symbolism,
      archetype_notes = @archetypeNotes,
      visual_notes = @visualNotes,
      associated_symbols = @associatedSymbols,
      guidebook_drafts = @guidebookDrafts,
      last_updated = @lastUpdated
    WHERE id = @id
  `).run({
    id: req.params.id,
    personalMeanings: JSON.stringify(c.personalMeanings || []),
    symbolism: JSON.stringify(c.symbolism || []),
    archetypeNotes: JSON.stringify(c.archetypeNotes || []),
    visualNotes: c.visualNotes || '',
    associatedSymbols: JSON.stringify(c.associatedSymbols || []),
    guidebookDrafts: JSON.stringify(c.guidebookDrafts || []),
    lastUpdated: c.lastUpdated || new Date().toISOString(),
  })
  res.json({ ok: true })
})

export default router
