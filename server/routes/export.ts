import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'

const router = Router()

router.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const [
    { data: entries },
    { data: customizations },
    { data: symbols },
    { data: themes },
    { data: images },
    { data: styleBible },
  ] = await Promise.all([
    supabase.from('entries').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('card_customizations').select('*').eq('user_id', userId),
    supabase.from('symbols').select('*').eq('user_id', userId),
    supabase.from('themes').select('*').eq('user_id', userId),
    supabase.from('images').select('*').eq('user_id', userId),
    supabase.from('style_bible').select('*').eq('user_id', userId).maybeSingle(),
  ])
  res.json({
    entries: entries ?? [],
    cards: customizations ?? [],
    symbols: symbols ?? [],
    themes: themes ?? [],
    images: images ?? [],
    styleBible: styleBible ?? null,
    exportedAt: new Date().toISOString(),
  })
})

router.post('/import', async (req, res) => {
  const { userId } = getAuth(req)
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid data' })

  const ops: Promise<unknown>[] = []

  if (Array.isArray(data.entries) && data.entries.length > 0) {
    ops.push(
      supabase.from('entries').upsert(
        data.entries.map((e: Record<string, unknown>) => ({ ...e, user_id: userId })),
        { onConflict: 'id' }
      )
    )
  }

  if (Array.isArray(data.cards) && data.cards.length > 0) {
    ops.push(
      supabase.from('card_customizations').upsert(
        data.cards.map((c: Record<string, unknown>) => ({ ...c, user_id: userId })),
        { onConflict: 'user_id,card_id' }
      )
    )
  }

  if (Array.isArray(data.symbols) && data.symbols.length > 0) {
    ops.push(
      supabase.from('symbols').upsert(
        data.symbols.map((s: Record<string, unknown>) => ({ ...s, user_id: userId })),
        { onConflict: 'id,user_id' }
      )
    )
  }

  if (Array.isArray(data.themes) && data.themes.length > 0) {
    ops.push(
      supabase.from('themes').upsert(
        data.themes.map((t: Record<string, unknown>) => ({ ...t, user_id: userId })),
        { onConflict: 'id,user_id' }
      )
    )
  }

  await Promise.all(ops)
  res.json({ ok: true })
})

export default router
