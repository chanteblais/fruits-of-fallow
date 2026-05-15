import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db'

const router = Router()

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function safeJson<T>(val: string, fallback: T): T {
  try { return JSON.parse(val) } catch { return fallback }
}

interface EntryRow {
  id: string; date: string; card_id: string; card_name: string; orientation: string
  primary_themes: string; personal_reflection: string; how_appeared: string
  quotes_insights: string; emerging_symbols: string; visual_direction: string
  psychological_themes: string; guidebook_notes: string; traditional_meaning: string
}

interface AnalysisRow {
  id: string; entry_id: string; card_id: string
  living_arcana_json: string; weaving_json: string
  cross_links_json: string; not_archived_json: string; created_at: string
}

function parseAnalysis(row: AnalysisRow) {
  return {
    id: row.id,
    entryId: row.entry_id,
    cardId: row.card_id,
    livingArcana: safeJson(row.living_arcana_json, {}),
    theWeaving: safeJson(row.weaving_json, {}),
    crossLinks: safeJson(row.cross_links_json, {}),
    notArchived: safeJson(row.not_archived_json, []),
    createdAt: row.created_at,
  }
}

// ── Get analysis for an entry ─────────────────────────────────────────────────
router.get('/entry/:entryId', (req, res) => {
  const row = db.prepare('SELECT * FROM entry_analysis WHERE entry_id = ?')
    .get(req.params.entryId) as AnalysisRow | undefined
  if (!row) return res.status(404).json({ error: 'Not yet analyzed' })
  res.json(parseAnalysis(row))
})

// ── Get all analyses for a card ───────────────────────────────────────────────
router.get('/card/:cardId', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM entry_analysis WHERE card_id = ? ORDER BY created_at DESC'
  ).all(req.params.cardId) as AnalysisRow[]
  res.json(rows.map(parseAnalysis))
})

// ── Core analysis logic (exported for fire-and-forget use) ───────────────────
export async function runAnalysis(entryId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?')
    .get(entryId) as EntryRow | undefined
  if (!entry) return

  const recentRows = db.prepare(
    'SELECT * FROM entries WHERE id != ? ORDER BY date DESC, created_at DESC LIMIT 12'
  ).all(entry.id) as EntryRow[]

  const formatEntry = (e: EntryRow, label: string) => {
    const symbols  = safeJson<string[]>(e.emerging_symbols, []).join(', ')
    const themes   = safeJson<string[]>(e.psychological_themes, []).join(', ')
    const lines    = [`${label}: ${e.date} — ${e.card_name} (${e.orientation})`]
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
  const contextFormatted = recentRows.length > 0
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

  db.prepare('DELETE FROM entry_analysis WHERE entry_id = ?').run(entry.id)

  db.prepare(`
    INSERT INTO entry_analysis (id, entry_id, card_id, living_arcana_json, weaving_json, cross_links_json, not_archived_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid(), entry.id, entry.card_id,
    JSON.stringify(parsed.living_arcana || {}),
    JSON.stringify(parsed.the_weaving || {}),
    JSON.stringify(parsed.cross_links || {}),
    JSON.stringify(parsed.not_archived || []),
    new Date().toISOString(),
  )
}

// ── Run analysis for an entry ─────────────────────────────────────────────────
router.post('/entry/:entryId', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured' })
  }

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?')
    .get(req.params.entryId) as EntryRow | undefined
  if (!entry) return res.status(404).json({ error: 'Entry not found' })

  try {
    await runAnalysis(req.params.entryId)
    const row = db.prepare('SELECT * FROM entry_analysis WHERE entry_id = ?')
      .get(req.params.entryId) as AnalysisRow | undefined
    if (!row) return res.status(500).json({ error: 'Analysis ran but result not found' })
    res.json(parseAnalysis(row))
  } catch (err) {
    console.error('Analysis error:', err)
    res.status(500).json({ error: 'Analysis failed — check server logs' })
  }
})

export default router
