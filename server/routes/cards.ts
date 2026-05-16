import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'

const router = Router()

function mergeCard(cardId: string, custom: Record<string, unknown> | null) {
  return {
    id: cardId,
    personalMeanings: custom?.personal_meanings ?? [],
    symbolism: custom?.symbolism ?? [],
    archetypeNotes: custom?.archetype_notes ?? [],
    visualNotes: custom?.visual_notes ?? '',
    associatedSymbols: custom?.associated_symbols ?? [],
    guidebookDrafts: custom?.guidebook_drafts ?? [],
    lastUpdated: custom?.last_updated ?? null,
  }
}

router.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const [{ data: cards, error: e1 }, { data: customs, error: e2 }] = await Promise.all([
    supabase.from('cards').select('id'),
    supabase.from('card_customizations').select('*').eq('user_id', userId),
  ])
  if (e1 || e2) return res.status(500).json({ error: (e1 ?? e2)?.message })
  const customMap = new Map((customs ?? []).map(c => [c.card_id, c]))
  res.json((cards ?? []).map(c => mergeCard(c.id, customMap.get(c.id) ?? null)))
})

router.get('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const [{ data: card, error: e1 }, { data: custom, error: e2 }] = await Promise.all([
    supabase.from('cards').select('id').eq('id', req.params.id).maybeSingle(),
    supabase.from('card_customizations').select('*')
      .eq('user_id', userId).eq('card_id', req.params.id).maybeSingle(),
  ])
  if (e1 || e2) return res.status(500).json({ error: (e1 ?? e2)?.message })
  if (!card) return res.status(404).json({ error: 'Not found' })
  res.json(mergeCard(card.id, custom))
})

router.put('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const c = req.body
  const { error } = await supabase.from('card_customizations').upsert({
    user_id: userId,
    card_id: req.params.id,
    personal_meanings: c.personalMeanings ?? [],
    symbolism: c.symbolism ?? [],
    archetype_notes: c.archetypeNotes ?? [],
    visual_notes: c.visualNotes ?? '',
    associated_symbols: c.associatedSymbols ?? [],
    guidebook_drafts: c.guidebookDrafts ?? [],
    last_updated: c.lastUpdated ?? new Date().toISOString(),
  }, { onConflict: 'user_id,card_id' })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
