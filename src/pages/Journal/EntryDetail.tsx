import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CARD_MAP, SUIT_COLOR } from '../../lib/cards'
import { fmt } from '../../lib/utils'
import type { CardImage, EntryAnalysis, JournalEntry } from '../../types'

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [cardImages, setCardImages] = useState<CardImage[]>([])
  const [analysis, setAnalysis] = useState<EntryAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!id) return
    api.entries.get(id).then(e => {
      setEntry(e)
      setLoading(false)
      if (e.cardId) api.images.list(e.cardId).then(setCardImages).catch(() => {})
    }).catch(() => setLoading(false))
    api.analyze.getForEntry(id).then(setAnalysis).catch(() => {})
  }, [id])

  if (loading) return <div className="loading">Loading entry…</div>
  if (!entry) return (
    <div>
      <p style={{ color: 'var(--cream-muted)' }}>Entry not found.</p>
      <Link to="/journal" className="btn" style={{ marginTop: 12, display: 'inline-block' }}>Back to Journal</Link>
    </div>
  )

  const card = CARD_MAP[entry.cardId]
  const suit = card?.suit || 'major'

  return (
    <>
      <div className="breadcrumb">
        <Link to="/journal">Journal</Link> › {fmt(entry.date)}
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{entry.cardName}</h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{fmt(entry.date)}</span>
            <span style={{ color: 'var(--cream-muted)' }}>·</span>
            <span>{entry.orientation}</span>
            {card && (
              <>
                <span style={{ color: 'var(--cream-muted)' }}>·</span>
                <span className={`tag tag-suit-${suit}`}>{suit}</span>
              </>
            )}
            {entry.primaryThemes && (
              <>
                <span style={{ color: 'var(--cream-muted)' }}>·</span>
                <span style={{ fontSize: 13, color: 'var(--cream-dim)', fontStyle: 'italic' }}>{entry.primaryThemes}</span>
              </>
            )}
          </p>
        </div>
        <Link to={`/journal/${entry.id}/edit`} className="btn btn-sm">Edit</Link>
      </div>

      {/* ── Card Artwork ── */}
      {cardImages.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[...cardImages].reverse().map((img, i) => (
              <div key={img.id} style={{ display: 'inline-block' }}>
                <img
                  src={`/images/${img.filename}`}
                  alt={img.caption || ''}
                  style={{
                    height: i === 0 ? 220 : 110,
                    width: 'auto',
                    borderRadius: 8,
                    display: 'block',
                    border: '1px solid var(--border)',
                    opacity: i === 0 ? 1 : 0.75,
                  }}
                />
                {(img.caption || img.iteration) && (
                  <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 4 }}>
                    {img.caption}
                    {img.iteration && <span style={{ color: 'var(--gold-dim)', marginLeft: 4 }}>#{img.iteration}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Traditional Meaning ── */}
      {entry.traditionalMeaning && (
        <Section label="Traditional Meaning">{entry.traditionalMeaning}</Section>
      )}

      {/* ── Personal Reflection ── */}
      {entry.personalReflection && (
        <Section label="Personal Reflection">{entry.personalReflection}</Section>
      )}

      {/* ── How the Card Appeared Today ── */}
      {entry.howAppeared && (
        <Section label="How the Card Appeared Today">{entry.howAppeared}</Section>
      )}

      {/* ── Quotes & Insights ── */}
      {entry.quotesInsights && (
        <Section label="Quotes & Insights">
          <span style={{ fontStyle: 'italic' }}>{entry.quotesInsights}</span>
        </Section>
      )}

      {/* ── Emerging Symbols ── */}
      {entry.emergingSymbols?.length > 0 && (
        <Section label="Emerging Symbols">
          <div>
            {entry.emergingSymbols.map(s => (
              <span key={s} className="tag tag-indigo">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Visual Direction ── */}
      {entry.visualDirection && (
        <Section label="Visual Direction">{entry.visualDirection}</Section>
      )}

      {/* ── Psychological Themes ── */}
      {entry.psychologicalThemes?.length > 0 && (
        <Section label="Psychological Themes">
          <div>
            {entry.psychologicalThemes.map(t => (
              <span key={t} className="tag tag-gold">{t}</span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Guidebook Notes ── */}
      {entry.guidebookNotes && (
        <div className="panel" style={{ marginTop: 20, borderColor: 'var(--gold-dim)' }}>
          <Section label="Guidebook Notes">{entry.guidebookNotes}</Section>
        </div>
      )}

      <div className="ornament" style={{ marginTop: 32 }}>· · ·</div>

      {/* ── Analysis ── */}
      <div style={{ marginTop: 28, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
            Insights Extracted
          </span>
          <button
            className="btn btn-sm btn-ghost"
            onClick={async () => {
              if (!id) return
              setAnalyzing(true)
              try { setAnalysis(await api.analyze.run(id)) } catch { /* no api key or failed */ }
              finally { setAnalyzing(false) }
            }}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing…' : analysis ? '↺ Re-analyze' : '✦ Analyze'}
          </button>
        </div>

        {analysis ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <AnalysisColumn
              title="✧ Living Arcana"
              sections={[
                { label: 'Card Meanings', items: analysis.livingArcana.card_meaning_additions },
                { label: 'Visual Language', items: analysis.livingArcana.visual_notes },
                { label: 'Symbols', items: analysis.livingArcana.symbol_connections },
                { label: 'Guidebook Phrases', items: analysis.livingArcana.guidebook_phrases },
                { label: 'Questions', items: analysis.livingArcana.questions_to_revisit },
              ]}
            />
            <AnalysisColumn
              title="✦ Living Thread"
              sections={[
                { label: 'Themes', items: analysis.theWeaving.emerging_themes },
                { label: 'Symbols', items: analysis.theWeaving.recurring_symbols },
                { label: 'Moments', items: analysis.theWeaving.poignant_moments },
                { label: 'Threads', items: analysis.theWeaving.weaving_threads },
                { label: 'Connections', items: analysis.theWeaving.connections_to_previous },
                { label: 'Essay Seeds', items: analysis.theWeaving.essay_seeds },
              ]}
            />
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--cream-muted)', fontStyle: 'italic' }}>
            Click <strong>✦ Analyze</strong> to extract insights for Living Arcana and The Living Thread.
          </p>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {card && (
          <Link to={`/living-arcana/${entry.cardId}`} className="btn btn-sm">
            {entry.cardName} in Living Arcana →
          </Link>
        )}
      </div>
    </>
  )
}

interface AnalysisItem { text: string; type: string; reason: string }

function AnalysisColumn({ title, sections }: {
  title: string
  sections: { label: string; items?: AnalysisItem[] }[]
}) {
  const hasAny = sections.some(s => s.items && s.items.length > 0)
  if (!hasAny) return null
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 12, fontWeight: 600 }}>{title}</div>
      {sections.map(s => s.items && s.items.length > 0 ? (
        <div key={s.label} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--cream-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
          {s.items.map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 4, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
              {item.text}
            </div>
          ))}
        </div>
      ) : null)}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-section" style={{ marginBottom: 20 }}>
      <div className="ds-label">{label}</div>
      <div className="ds-value">{children}</div>
    </div>
  )
}
