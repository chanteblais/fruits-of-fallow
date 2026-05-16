import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'

const router = Router()

const DEFAULT_SYMBOLS = [
  'lantern','eye','moon','serpent','threshold','mirror','hands','staircase',
  'candle','curtain','fabric','shrimp','key','star','window','water','fire',
  'crown','sword','tower','rose','wheel','sun','spider','bird','forest',
]

function parseSymbol(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    meaning: row.meaning ?? '',
    poeticEssence: row.poetic_essence ?? '',
    voice: row.voice ?? '',
    elementalQuality: row.elemental_quality ?? '',
    season: row.season ?? '',
    recurringContexts: row.recurring_contexts ?? '',
    emotionalAssociations: row.emotional_associations ?? [],
    connectedCards: row.connected_cards ?? [],
    appearances: row.appearances ?? [],
    evolution: row.evolution ?? [],
    fieldNotes: row.field_notes ?? [],
    relatedSymbols: row.related_symbols ?? [],
    journalBacklinks: row.journal_backlinks ?? [],
  }
}

async function seedSymbols(userId: string) {
  await supabase.from('symbols').insert(
    DEFAULT_SYMBOLS.map(s => ({
      id: s,
      user_id: userId,
      name: s.charAt(0).toUpperCase() + s.slice(1),
    }))
  )
}

router.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  let { data, error } = await supabase
    .from('symbols').select('*')
    .eq('user_id', userId).order('name', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  if (!data || data.length === 0) {
    await seedSymbols(userId!)
    const result = await supabase.from('symbols').select('*')
      .eq('user_id', userId).order('name', { ascending: true })
    data = result.data ?? []
  }
  res.json(data.map(parseSymbol))
})

router.get('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('symbols').select('*')
    .eq('id', req.params.id).eq('user_id', userId).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  res.json(parseSymbol(data))
})

router.put('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const s = req.body
  const { error } = await supabase.from('symbols').upsert({
    id: req.params.id,
    user_id: userId,
    name: s.name ?? req.params.id,
    meaning: s.meaning ?? '',
    poetic_essence: s.poeticEssence ?? '',
    voice: s.voice ?? '',
    elemental_quality: s.elementalQuality ?? '',
    season: s.season ?? '',
    recurring_contexts: s.recurringContexts ?? '',
    emotional_associations: s.emotionalAssociations ?? [],
    connected_cards: s.connectedCards ?? [],
    appearances: s.appearances ?? [],
    evolution: s.evolution ?? [],
    field_notes: s.fieldNotes ?? [],
    related_symbols: s.relatedSymbols ?? [],
    journal_backlinks: s.journalBacklinks ?? [],
  }, { onConflict: 'id,user_id' })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
