import { Router } from 'express'
import { db } from '../db'
import { runAnalysis } from './analyze'

const router = Router()

function parseEntry(row: Record<string, unknown>) {
  if (!row) return null
  return {
    id: row.id,
    date: row.date,
    cardId: row.card_id,
    cardName: row.card_name,
    suit: row.suit,
    orientation: row.orientation,
    primaryThemes: row.primary_themes || '',
    traditionalMeaning: row.traditional_meaning || '',
    personalReflection: row.personal_reflection || '',
    howAppeared: row.how_appeared || '',
    quotesInsights: row.quotes_insights || '',
    emergingSymbols: JSON.parse(row.emerging_symbols as string || '[]'),
    visualDirection: row.visual_direction || '',
    psychologicalThemes: JSON.parse(row.psychological_themes as string || '[]'),
    guidebookNotes: row.guidebook_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM entries ORDER BY date DESC').all() as Record<string, unknown>[]
  res.json(rows.map(parseEntry))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(parseEntry(row))
})

router.post('/', (req, res) => {
  const e = req.body
  db.prepare(`
    INSERT INTO entries (
      id, date, card_id, card_name, suit, orientation,
      primary_themes, traditional_meaning, personal_reflection,
      how_appeared, quotes_insights, emerging_symbols,
      visual_direction, psychological_themes, guidebook_notes,
      created_at, updated_at
    ) VALUES (
      @id, @date, @cardId, @cardName, @suit, @orientation,
      @primaryThemes, @traditionalMeaning, @personalReflection,
      @howAppeared, @quotesInsights, @emergingSymbols,
      @visualDirection, @psychologicalThemes, @guidebookNotes,
      @createdAt, @updatedAt
    )
  `).run({
    ...e,
    emergingSymbols: JSON.stringify(e.emergingSymbols || []),
    psychologicalThemes: JSON.stringify(e.psychologicalThemes || []),
  })
  runAnalysis(e.id).catch(err => console.error('Auto-analysis failed:', err))
  res.json({ ok: true })
})

router.put('/:id', (req, res) => {
  const e = req.body
  db.prepare(`
    UPDATE entries SET
      date = @date, card_id = @cardId, card_name = @cardName, suit = @suit,
      orientation = @orientation, primary_themes = @primaryThemes,
      traditional_meaning = @traditionalMeaning,
      personal_reflection = @personalReflection, how_appeared = @howAppeared,
      quotes_insights = @quotesInsights, emerging_symbols = @emergingSymbols,
      visual_direction = @visualDirection, psychological_themes = @psychologicalThemes,
      guidebook_notes = @guidebookNotes, updated_at = @updatedAt
    WHERE id = @id
  `).run({
    ...e,
    id: req.params.id,
    emergingSymbols: JSON.stringify(e.emergingSymbols || []),
    psychologicalThemes: JSON.stringify(e.psychologicalThemes || []),
  })
  runAnalysis(req.params.id).catch(err => console.error('Auto-analysis failed:', err))
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
