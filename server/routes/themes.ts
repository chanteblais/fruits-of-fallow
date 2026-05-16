import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'

const router = Router()

const DEFAULT_THEMES = [
  'Obsession & Temperance','Thresholds & Initiation','Belonging',
  'Creative Fire','Stewardship','Identity Formation','Emergence',
  'Illusion','Grief','Attunement','Community','Shadow Work',
  'Transformation','Intuition','Power & Surrender',
]

function parseTheme(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    relatedCards: row.related_cards ?? [],
    occurrences: row.occurrences ?? [],
    emotionalPatterns: row.emotional_patterns ?? [],
    evolvedMeanings: row.evolved_meanings ?? [],
  }
}

async function seedThemes(userId: string) {
  await supabase.from('themes').insert(
    DEFAULT_THEMES.map(t => ({ id: t, user_id: userId, name: t }))
  )
}

router.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  let { data, error } = await supabase
    .from('themes').select('*')
    .eq('user_id', userId).order('name', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  if (!data || data.length === 0) {
    await seedThemes(userId!)
    const result = await supabase.from('themes').select('*')
      .eq('user_id', userId).order('name', { ascending: true })
    data = result.data ?? []
  }
  res.json(data.map(parseTheme))
})

router.get('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('themes').select('*')
    .eq('id', req.params.id).eq('user_id', userId).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  res.json(parseTheme(data))
})

router.put('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const t = req.body
  const { error } = await supabase.from('themes').upsert({
    id: req.params.id,
    user_id: userId,
    name: t.name ?? req.params.id,
    description: t.description ?? '',
    related_cards: t.relatedCards ?? [],
    occurrences: t.occurrences ?? [],
    emotional_patterns: t.emotionalPatterns ?? [],
    evolved_meanings: t.evolvedMeanings ?? [],
  }, { onConflict: 'id,user_id' })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
