import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'

const router = Router()

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function safeJson<T>(val: unknown, fallback: T): T {
  if (typeof val !== 'string') return (val as T) ?? fallback
  try { return JSON.parse(val) } catch { return fallback }
}

function parseThread(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    focus: row.focus,
    body: row.body,
    threads: row.threads_json ?? [],
    entryIds: row.entry_ids ?? [],
    cardsObserved: row.cards_observed ?? [],
    symbolsObserved: row.symbols_observed ?? [],
    entryCount: row.entry_count,
    createdAt: row.created_at,
  }
}

router.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('weaving_threads').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json((data ?? []).map(parseThread))
})

router.get('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('weaving_threads').select('*')
    .eq('id', req.params.id).eq('user_id', userId).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Thread not found' })
  res.json(parseThread(data))
})

router.delete('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { error } = await supabase.from('weaving_threads')
    .delete().eq('id', req.params.id).eq('user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

router.post('/synthesize', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set.' })
  }
  const { userId } = getAuth(req)
  const { focus = '', maxEntries = 20 } = req.body as { focus?: string; maxEntries?: number }

  const { data: entries, error } = await supabase
    .from('entries').select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(maxEntries)
  if (error) return res.status(500).json({ error: error.message })
  if (!entries || entries.length === 0) {
    return res.status(400).json({ error: 'No journal entries to thread yet.' })
  }

  const formatted = entries.map((e, i) => {
    const symbols = safeJson<string[]>(e.emerging_symbols, []).join(', ')
    const themes  = safeJson<string[]>(e.psychological_themes, []).join(', ')
    const lines   = [`Entry ${i + 1}: ${e.date} — ${e.card_name} (${e.orientation})`]
    if (e.primary_themes)      lines.push(`Themes: ${e.primary_themes}`)
    if (e.personal_reflection) lines.push(`Reflection: ${e.personal_reflection}`)
    if (e.how_appeared)        lines.push(`How It Appeared: ${e.how_appeared}`)
    if (symbols)               lines.push(`Symbols: ${symbols}`)
    if (themes)                lines.push(`Psychological: ${themes}`)
    if (e.visual_direction)    lines.push(`Visual Direction: ${e.visual_direction}`)
    if (e.guidebook_notes)     lines.push(`Guidebook Notes: ${e.guidebook_notes}`)
    if (e.quotes_insights)     lines.push(`Quotes: ${e.quotes_insights}`)
    return lines.join('\n')
  }).join('\n---\n')

  const focusLine = focus.trim() ? `\n\nThe practitioner is asking: ${focus}\n` : ''

  const prompt = `You are the Living Thread — the mythic observer within "The Inner Atlas," a personal tarot practice and deck-development journal.${focusLine}

Your purpose is not to catalogue or summarise. Your purpose is to perceive what story is emerging through these encounters with the cards.

You are not looking for:
- Themes that appear frequently
- Psychological insights that can be neatly named
- A summary of what happened

You are looking for:
- Symbolic weather patterns becoming intelligible — not "this symbol appeared 3 times" but "something is gathering around thresholds"
- Archetypal movement — figures, forces, and tensions that recur and deepen like characters in a slow dream
- Emotional geography — the recurring landscapes of feeling, the places the practitioner keeps returning to
- Dream logic — how images speak to each other sideways, through resonance and echo rather than reason
- Synchronicity — when cards seem to answer each other across time, when a symbol reappears just as its meaning shifts
- Mythic structure — the deeper narrative shape that only becomes visible across many entries

Here are the journal entries (most recent first):

${formatted}

Write a Living Thread entry — an observation of what story is emerging through these encounters.

This should NOT be:
- Fantasy lore or invented fiction
- A list of recurring themes or symbols
- A clinical psychological analysis
- Forced narrative or scripted storytelling
- Mystical vagueness

It SHOULD feel like:
- Symbolic weather slowly becoming readable
- A dream that is beginning to make a kind of sense
- Watching an archetypal force move through real, embodied experience
- The emotional and symbolic shape of something genuinely alive

Tone: warm, psychologically aware, grounded, contemplative. The voice of a thoughtful symbolic observer — not a mystic, not a therapist, not a narrator.

Return ONLY valid JSON (no markdown fences, no preamble):
{
  "title": "3-6 words — name this thread as you would name a chapter of a living mythology",
  "body": "4-6 paragraphs separated by \\n\\n. Write as mythic observation. Let it feel like reading the margins of a deeply felt journal — not a report, but a slow illumination of what is already there.",
  "threads": [
    { "label": "the symbolic motif, figure, or emotional territory", "observation": "how it moves, what it carries, how it has shifted or deepened across these entries" }
  ],
  "cards_observed": ["card names as they appear"],
  "symbols_observed": ["symbol names"]
}

The threads array should name 4-8 recurring motifs, archetypal figures, or emotional territories — not themes, but living symbolic presences. The body should feel worth returning to.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: 'text'; text: string }).text.trim()
    const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(jsonText)

    const id = uid()
    const now = new Date().toISOString()
    const entryIds = entries.map(e => e.id)

    const { error: insertError } = await supabase.from('weaving_threads').insert({
      id,
      user_id: userId,
      title: parsed.title || 'Untitled Weaving',
      focus,
      body: parsed.body || '',
      threads_json: parsed.threads ?? [],
      entry_ids: entryIds,
      cards_observed: parsed.cards_observed ?? [],
      symbols_observed: parsed.symbols_observed ?? [],
      entry_count: entries.length,
      created_at: now,
    })
    if (insertError) return res.status(500).json({ error: insertError.message })

    res.json({
      id, title: parsed.title, focus, body: parsed.body,
      threads: parsed.threads ?? [],
      entryIds,
      cardsObserved: parsed.cards_observed ?? [],
      symbolsObserved: parsed.symbols_observed ?? [],
      entryCount: entries.length,
      createdAt: now,
    })
  } catch (err) {
    console.error('Weaving synthesis error:', err)
    res.status(500).json({ error: 'Synthesis failed — check server logs' })
  }
})

export default router
