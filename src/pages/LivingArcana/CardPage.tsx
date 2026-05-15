import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CARD_MAP, SUIT_COLOR } from '../../lib/cards'
import { fmt } from '../../lib/utils'
import type { CardImage, EntryAnalysis, JournalEntry } from '../../types'

const TYPE_COLOR: Record<string, string> = {
  'Card Meaning':          'var(--gold)',
  'Guidebook Phrase':      'var(--gold)',
  'Visual Motif':          '#7a9acf',
  'Symbol':                'var(--accent-indigo)',
  'Theme':                 '#9b7cc8',
  'Weaving Thread':        '#c87c9b',
  'Possible Future Essay': '#7cc89b',
  'Synchronicity':         '#c8a07c',
  'Question to Revisit':   'var(--cream-muted)',
}

interface AnalysisItem { text: string; type: string; reason: string }

function InsightItem({ item }: { item: AnalysisItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{item.text}</div>
      {open && (
        <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 4, fontStyle: 'italic' }}>
          {item.reason}
        </div>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items?: AnalysisItem[] }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      {items.map((item, i) => <InsightItem key={i} item={item} />)}
    </div>
  )
}

export default function CardPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [analyses, setAnalyses] = useState<EntryAnalysis[]>([])
  const [cardImages, setCardImages] = useState<CardImage[]>([])
  const [loading, setLoading] = useState(true)

  const card = cardId ? CARD_MAP[cardId] : null

  useEffect(() => {
    if (!cardId) return
    Promise.all([
      api.entries.list(),
      api.analyze.getForCard(cardId).catch(() => [] as EntryAnalysis[]),
      api.images.list(cardId).catch(() => [] as CardImage[]),
    ]).then(([allEntries, cardAnalyses, imgs]) => {
      setEntries(allEntries.filter(e => e.cardId === cardId))
      setAnalyses(cardAnalyses)
      setCardImages(imgs)
      setLoading(false)
    })
  }, [cardId])

  if (!card) return (
    <div>
      <p style={{ color: 'var(--cream-muted)' }}>Card not found.</p>
      <Link to="/living-arcana" className="btn" style={{ marginTop: 12, display: 'inline-block' }}>Back</Link>
    </div>
  )

  // Aggregate all items across all analyses
  const allLivingArcana = {
    card_meaning_additions: analyses.flatMap(a => a.livingArcana.card_meaning_additions || []),
    visual_notes:           analyses.flatMap(a => a.livingArcana.visual_notes || []),
    symbol_connections:     analyses.flatMap(a => a.livingArcana.symbol_connections || []),
    guidebook_phrases:      analyses.flatMap(a => a.livingArcana.guidebook_phrases || []),
    questions_to_revisit:   analyses.flatMap(a => a.livingArcana.questions_to_revisit || []),
  }

  const allWeaving = {
    emerging_themes:        analyses.flatMap(a => a.theWeaving.emerging_themes || []),
    recurring_symbols:      analyses.flatMap(a => a.theWeaving.recurring_symbols || []),
    poignant_moments:       analyses.flatMap(a => a.theWeaving.poignant_moments || []),
    weaving_threads:        analyses.flatMap(a => a.theWeaving.weaving_threads || []),
    connections_to_previous:analyses.flatMap(a => a.theWeaving.connections_to_previous || []),
    essay_seeds:            analyses.flatMap(a => a.theWeaving.essay_seeds || []),
  }

  const hasLivingArcana = Object.values(allLivingArcana).some(a => a.length > 0)
  const hasWeaving      = Object.values(allWeaving).some(a => a.length > 0)

  const allLinkedCards   = [...new Set(analyses.flatMap(a => a.crossLinks.linked_cards || []))]
  const allLinkedSymbols = [...new Set(analyses.flatMap(a => a.crossLinks.linked_symbols || []))]
  const allLinkedThemes  = [...new Set(analyses.flatMap(a => a.crossLinks.linked_themes || []))]

  const latestImage = cardImages.length > 0 ? cardImages[cardImages.length - 1] : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="breadcrumb">
        <Link to="/living-arcana">Living Arcana</Link> › {card.name}
      </div>

      {/* ── Card Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>{card.name}</h2>
          <span className={`tag tag-suit-${card.suit}`}>{card.suit}</span>
          {card.num > 0 && card.suit === 'major' && (
            <span style={{ fontSize: 12, color: 'var(--cream-muted)' }}>
              {card.num > 0 ? `Arcanum ${card.num}` : 'The Fool · 0'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--cream-muted)', marginTop: 6 }}>
          {card.element && <span>Element: {card.element}</span>}
          {card.astro && <span>·</span>}
          {card.astro && <span>{card.astro}</span>}
          {entries.length > 0 && <span>·</span>}
          {entries.length > 0 && (
            <span style={{ color: 'var(--gold-dim)' }}>
              {entries.length} {entries.length === 1 ? 'pull' : 'pulls'} recorded
            </span>
          )}
        </div>
        {card.traditional && (
          <p style={{ fontSize: 12, color: 'var(--cream-muted)', fontStyle: 'italic', marginTop: 8, marginBottom: 0, maxWidth: 560 }}>
            {card.traditional}
          </p>
        )}
      </div>

      {latestImage && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={`/images/${latestImage.filename}`}
              alt={latestImage.caption || card.name}
              style={{
                height: 260,
                width: 'auto',
                borderRadius: 10,
                border: '1px solid var(--border)',
                display: 'block',
              }}
            />
            {(latestImage.caption || latestImage.iteration) && (
              <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 6 }}>
                {latestImage.caption}
                {latestImage.iteration && (
                  <span style={{ color: 'var(--gold-dim)', marginLeft: 4 }}>#{latestImage.iteration}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '32px 0', color: 'var(--cream-muted)' }}>
          <p style={{ marginBottom: 16 }}>No pulls recorded for {card.name} yet.</p>
          <Link to="/journal/new" className="btn btn-sm">Log a Pull</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 900, alignItems: 'start' }}>

          {/* ── Left: Living Arcana ── */}
          <div>
            <h3 style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 20 }}>
              ✧ Living Arcana
            </h3>

            {!hasLivingArcana ? (
              <p style={{ fontSize: 13, color: 'var(--cream-muted)', fontStyle: 'italic' }}>
                Analyze a pull to begin building this card's page.
              </p>
            ) : (
              <>
                <Section title="Card Meanings & Interpretations" items={allLivingArcana.card_meaning_additions} />
                <Section title="Visual Language" items={allLivingArcana.visual_notes} />
                <Section title="Connected Symbols" items={allLivingArcana.symbol_connections} />
                <Section title="Guidebook Phrases" items={allLivingArcana.guidebook_phrases} />
                <Section title="Questions to Revisit" items={allLivingArcana.questions_to_revisit} />
              </>
            )}
          </div>

          {/* ── Right: Living Thread ── */}
          <div>
            <h3 style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 20 }}>
              ✦ Living Thread
            </h3>

            {!hasWeaving ? (
              <p style={{ fontSize: 13, color: 'var(--cream-muted)', fontStyle: 'italic' }}>
                No mythic threads extracted yet.
              </p>
            ) : (
              <>
                <Section title="Emerging Themes" items={allWeaving.emerging_themes} />
                <Section title="Recurring Symbols" items={allWeaving.recurring_symbols} />
                <Section title="Poignant Moments" items={allWeaving.poignant_moments} />
                <Section title="Weaving Threads" items={allWeaving.weaving_threads} />
                <Section title="Connections Across Time" items={allWeaving.connections_to_previous} />
                <Section title="Essay Seeds" items={allWeaving.essay_seeds} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Cross Links ── */}
      {(allLinkedCards.length > 0 || allLinkedSymbols.length > 0 || allLinkedThemes.length > 0) && (
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 12 }}>
            Cross-Links
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allLinkedCards.map(c => <span key={c} className="tag" style={{ borderColor: 'var(--gold-dim)', color: 'var(--cream-dim)' }}>{c}</span>)}
            {allLinkedSymbols.map(s => <span key={s} className="tag tag-indigo">{s}</span>)}
            {allLinkedThemes.map(t => <span key={t} className="tag tag-gold">{t}</span>)}
          </div>
        </div>
      )}

      {/* ── Pull History ── */}
      {entries.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 14 }}>
            Pull History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--cream-muted)', minWidth: 90 }}>{fmt(e.date)}</span>
                <span style={{ fontSize: 12, color: 'var(--cream-muted)' }}>{e.orientation}</span>
                {e.primaryThemes && (
                  <span style={{ fontSize: 12, color: 'var(--cream-dim)', fontStyle: 'italic' }}>{e.primaryThemes}</span>
                )}
                <Link to={`/journal/${e.id}`} style={{ fontSize: 11, color: 'var(--gold-dim)', marginLeft: 'auto' }}>
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, marginBottom: 48 }}>
        <Link to="/living-arcana" className="btn btn-sm">← Living Arcana</Link>
      </div>
    </div>
  )
}
