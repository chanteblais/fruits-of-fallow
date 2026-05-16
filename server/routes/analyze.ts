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

function parseAnalysis(row: Record<string, unknown>) {
  return {
    id: row.id,
    entryId: row.entry_id,
    cardId: row.card_id,
    livingArcana: row.living_arcana_json ?? {},
    theWeaving: row.weaving_json ?? {},
    crossLinks: row.cross_links_json ?? {},
    notArchived: row.not_archived_json ?? [],
    createdAt: row.created_at,
  }
}

router.get('/entry/:entryId', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('entry_analysis').select('*')
    .eq('entry_id', req.params.entryId).eq('user_id', userId).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not yet analyzed' })
  res.json(parseAnalysis(data))
})

router.get('/card/:cardId', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('entry_analysis').select('*')
    .eq('card_id', req.params.cardId).eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json((data ?? []).map(parseAnalysis))
})

export async function runAnalysis(entryId: string, userId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return

  const { data: entry } = await supabase
    .from('entries').select('*')
    .eq('id', entryId).eq('user_id', userId).maybeSingle()
  if (!entry) return

  const { data: recentRows } = await supabase
    .from('entries').select('*')
    .eq('user_id', userId).neq('id', entryId)
    .order('date', { ascending: false })
    .limit(12)

  const formatEntry = (e: Record<string, unknown>, label: string) => {
    const symbols = safeJson<string[]>(e.emerging_symbols, []).join(', ')
    const themes  = safeJson<string[]>(e.psychological_themes, []).join(', ')
    const lines   = [`${label}: ${e.date} — ${e.card_name} (${e.orientation})`]
    if (e.primary_themes)      lines.push(`Themes: ${e.primary_themes}`)
    if (e.personal_reflection) lines.push(`Reflection: ${e.personal_reflection}`)
    if (e.how_appeared)        lines.push(`How It Appeared: ${e.how_appeared}`)
    if (e.quotes_insights)     lines.push(`Quotes: ${e.quotes_insights}`)
    if (symbols)               lines.push(`Symbols: ${symbols}`)
    if (themes)                lines.push(`Psychological: ${themes}`)
    if (e.visual_direction)    lines.push(`Visual Direction: ${e.visual_direction}`)
    if (e.guidebook_notes)     lines.push(`Guidebook Notes: ${e.guidebook_notes}`)
    if (e.traditional_meaning) lines.push(`Traditional Meaning: ${e.traditional_meaning}`)
    return lines.join('\n')
  }

  const currentFormatted = formatEntry(entry, 'CURRENT ENTRY')
  const contextFormatted = recentRows && recentRows.length > 0
    ? recentRows.map((e, i) => formatEntry(e, `Previous Entry ${i + 1}`)).join('\n---\n')
    : 'No previous entries.'

  const prompt = `You are the analytical intelligence within "The Inner Atlas" — a personal tarot practice and deck-development system.

Your task: analyze a single journal entry and extract only the material worth preserving in the larger project architecture.

Do not summarise everything. Decide what is meaningful enough to preserve, cross-link, or evolve. Be selective — 3–5 items per section maximum. Quality over quantity. Leave arrays empty if nothing is genuinely worth extracting.

${currentFormatted}

---
RECENT ENTRIES FOR CONTEXT (to identify recurrence and connections):
${contextFormatted}

---
Extract material for two sections:

LIVING ARCANA — the evolving symbolic guidebook for ${entry.card_name}
Ask: "What did this pull teach us about ${entry.card_name}?"
Extract: personal interpretations, traditional meaning refinements, recurring emotional associations, distinct nuances, archetypal insights, visual direction, connected symbols, guidebook-worthy phrases, shifts in understanding.

THE LIVING THREAD — the mythic/symbolic narrative layer
Ask: "What story, pattern, or symbolic thread is emerging here?"
Extract: recurring themes, poignant phrases or insights, emotional turning points, symbols that feel especially alive, tensions that repeat across entries, synchronicities, metaphors that may become part of the project's mythology, moments that feel narratively significant, connections to previous pulls.

Prioritise material that is:
- Emotionally charged or symbolically rich
- Repeated across multiple entries or likely to recur
- Visually generative (useful for developing card imagery)
- Philosophically meaningful or unusually specific to this practitioner
- Useful for guidebook writing
- Connected to previous entries

For each item assign one type:
Card Meaning | Symbol | Theme | Visual Motif | Guidebook Phrase | Weaving Thread | Possible Future Essay | Synchronicity | Question to Revisit

Return ONLY valid JSON (no fences, no preamble):
{
  "living_arcana": {
    "card_meaning_additions": [{"text": "...", "type": "Card Meaning", "reason": "brief why this is worth preserving"}],
    "visual_notes": [{"text": "...", "type": "Visual Motif", "reason": "..."}],
    "symbol_connections": [{"text": "...", "type": "Symbol", "reason": "..."}],
    "guidebook_phrases": [{"text": "...", "type": "Guidebook Phrase", "reason": "..."}],
    "questions_to_revisit": [{"text": "...", "type": "Question to Revisit", "reason": "..."}]
  },
  "the_weaving": {
    "emerging_themes": [{"text": "...", "type": "Theme", "reason": "..."}],
    "recurring_symbols": [{"text": "...", "type": "Symbol", "reason": "..."}],
    "poignant_moments": [{"text": "...", "type": "Weaving Thread", "reason": "..."}],
    "weaving_threads": [{"text": "...", "type": "Weaving Thread", "reason": "..."}],
    "connections_to_previous": [{"text": "...", "type": "Synchronicity", "reason": "..."}],
    "essay_seeds": [{"text": "...", "type": "Possible Future Essay", "reason": "..."}]
  },
  "cross_links": {
    "linked_cards": ["card name"],
    "linked_symbols": ["symbol"],
    "linked_themes": ["theme"],
    "linked_entry_dates": ["YYYY-MM-DD of related entry"]
  },
  "not_archived": [{"text": "...", "reason": "why this is not worth preserving — too generic, temporary, already implicit"}]
}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: 'text'; text: string }).text.trim()
  const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(jsonText)

  await supabase.from('entry_analysis')
    .delete().eq('entry_id', entry.id).eq('user_id', userId)

  await supabase.from('entry_analysis').insert({
    id: uid(),
    user_id: userId,
    entry_id: entry.id,
    card_id: entry.card_id,
    living_arcana_json: parsed.living_arcana ?? {},
    weaving_json: parsed.the_weaving ?? {},
    cross_links_json: parsed.cross_links ?? {},
    not_archived_json: parsed.not_archived ?? [],
    created_at: new Date().toISOString(),
  })
}

router.post('/entry/:entryId', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured' })
  }
  const { userId } = getAuth(req)
  const { data: entry } = await supabase
    .from('entries').select('id').eq('id', req.params.entryId).eq('user_id', userId).maybeSingle()
  if (!entry) return res.status(404).json({ error: 'Entry not found' })

  try {
    await runAnalysis(req.params.entryId, userId!)
    const { data, error } = await supabase
      .from('entry_analysis').select('*')
      .eq('entry_id', req.params.entryId).eq('user_id', userId).maybeSingle()
    if (error || !data) return res.status(500).json({ error: 'Analysis ran but result not found' })
    res.json(parseAnalysis(data))
  } catch (err) {
    console.error('Analysis error:', err)
    res.status(500).json({ error: 'Analysis failed — check server logs' })
  }
})

export default router
