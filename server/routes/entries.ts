import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'
import { runAnalysis } from './analyze'

const router = Router()

function parseEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    date: row.date,
    cardId: row.card_id,
    cardName: row.card_name,
    suit: row.suit,
    orientation: row.orientation,
    primaryThemes: row.primary_themes ?? '',
    traditionalMeaning: row.traditional_meaning ?? '',
    personalReflection: row.personal_reflection ?? '',
    howAppeared: row.how_appeared ?? '',
    quotesInsights: row.quotes_insights ?? '',
    emergingSymbols: row.emerging_symbols ?? [],
    visualDirection: row.visual_direction ?? '',
    psychologicalThemes: row.psychological_themes ?? [],
    guidebookNotes: row.guidebook_notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('entries').select('*')
    .eq('user_id', userId).order('date', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json((data ?? []).map(parseEntry))
})

router.get('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('entries').select('*')
    .eq('id', req.params.id).eq('user_id', userId).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  res.json(parseEntry(data))
})

router.post('/', async (req, res) => {
  const { userId } = getAuth(req)
  const e = req.body
  const { error } = await supabase.from('entries').insert({
    id: e.id,
    user_id: userId,
    date: e.date,
    card_id: e.cardId,
    card_name: e.cardName,
    suit: e.suit,
    orientation: e.orientation,
    primary_themes: e.primaryThemes ?? '',
    traditional_meaning: e.traditionalMeaning ?? '',
    personal_reflection: e.personalReflection ?? '',
    how_appeared: e.howAppeared ?? '',
    quotes_insights: e.quotesInsights ?? '',
    emerging_symbols: e.emergingSymbols ?? [],
    visual_direction: e.visualDirection ?? '',
    psychological_themes: e.psychologicalThemes ?? [],
    guidebook_notes: e.guidebookNotes ?? '',
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  })
  if (error) return res.status(500).json({ error: error.message })
  runAnalysis(e.id, userId!).catch(err => console.error('Auto-analysis failed:', err))
  res.json({ ok: true })
})

router.put('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const e = req.body
  const { error } = await supabase.from('entries').update({
    date: e.date,
    card_id: e.cardId,
    card_name: e.cardName,
    suit: e.suit,
    orientation: e.orientation,
    primary_themes: e.primaryThemes ?? '',
    traditional_meaning: e.traditionalMeaning ?? '',
    personal_reflection: e.personalReflection ?? '',
    how_appeared: e.howAppeared ?? '',
    quotes_insights: e.quotesInsights ?? '',
    emerging_symbols: e.emergingSymbols ?? [],
    visual_direction: e.visualDirection ?? '',
    psychological_themes: e.psychologicalThemes ?? [],
    guidebook_notes: e.guidebookNotes ?? '',
    updated_at: e.updatedAt,
  }).eq('id', req.params.id).eq('user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  runAnalysis(req.params.id, userId!).catch(err => console.error('Auto-analysis failed:', err))
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { error } = await supabase.from('entries')
    .delete().eq('id', req.params.id).eq('user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
