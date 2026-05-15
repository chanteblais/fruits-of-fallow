import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { api } from '../lib/api'
import { CARD_MAP, SUIT_COLOR } from '../lib/cards'
import { fmt, fmtShort } from '../lib/utils'
import type { CardImage, JournalEntry, Symbol as TarotSymbol, TimestampedNote } from '../types'

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function symbolName(id: string, symbols: TarotSymbol[]) {
  return symbols.find(s => s.id === id)?.name || id
}

function getSightings(symbolId: string, entries: JournalEntry[]) {
  return entries
    .filter(entry => entry.emergingSymbols?.includes(symbolId))
    .sort((a, b) => b.date.localeCompare(a.date))
}

function latestSymbolImage(images?: CardImage[]) {
  return [...(images || [])].filter(img => img.refType === 'symbol').sort((a, b) => b.date.localeCompare(a.date))[0]
}

const SYMBOL_BUNDLE_EXTS = ['.png', '.webp', '.jpg', '.jpeg'] as const

/** Static artwork in `data/images/symbols/` (served as `/symbols/…`). */
function bundledSymbolSrcCandidates(symbolId: string): string[] {
  const base = symbolId.trim()
  if (!base) return []
  const variants = [...new Set([base, base.toLowerCase(), base.toUpperCase()])]
  const urls: string[] = []
  for (const v of variants) {
    for (const ext of SYMBOL_BUNDLE_EXTS) {
      urls.push(`/symbols/${encodeURIComponent(v)}${ext}`)
    }
  }
  return [...new Set(urls)]
}

function symbolLexiconImageCandidates(symbolId: string, uploadFilename?: string | null): string[] {
  const list: string[] = []
  if (uploadFilename) list.push(`/images/${uploadFilename}`)
  list.push(...bundledSymbolSrcCandidates(symbolId))
  return [...new Set(list)]
}

function SymbolLexiconImg({
  symbolId,
  uploadFilename,
  alt,
  fallback,
}: {
  symbolId: string
  uploadFilename?: string | null
  alt: string
  fallback: ReactNode
}) {
  const candidates = useMemo(
    () => symbolLexiconImageCandidates(symbolId, uploadFilename),
    [symbolId, uploadFilename ?? '']
  )
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [symbolId, uploadFilename ?? ''])

  if (idx >= candidates.length) return <>{fallback}</>

  return (
    <img
      src={candidates[idx]}
      alt={alt}
      onError={() => setIdx(i => i + 1)}
    />
  )
}

function symbolVitality(symbol: TarotSymbol, sightingCount: number) {
  return Math.min(
    sightingCount * 2.5 +
      (symbol.fieldNotes?.length || 0) * 2 +
      (symbol.evolution?.length || 0) * 1.5 +
      (symbol.connectedCards?.length || 0) +
      (symbol.relatedSymbols?.length || 0) +
      (symbol.poeticEssence ? 3 : 0) +
      (symbol.voice ? 2 : 0),
    30
  )
}

export default function SymbolLexicon() {
  const toast = useToast().toast
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [symbols, setSymbols] = useState<TarotSymbol[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [imagesBySymbol, setImagesBySymbol] = useState<Record<string, CardImage[]>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [emotionalInput, setEmotionalInput] = useState('')
  const [relatedInput, setRelatedInput] = useState('')
  const [fieldNoteInput, setFieldNoteInput] = useState('')
  const [showFieldNoteInput, setShowFieldNoteInput] = useState(false)

  useEffect(() => {
    Promise.all([api.symbols.list(), api.entries.list()])
      .then(([symbolRows, entryRows]) => {
        setSymbols(symbolRows)
        setEntries(entryRows)
        setSelectedId(symbolRows[0]?.id || null)
        setLoading(false)
        return Promise.all(
          symbolRows.map(symbol =>
            api.images.list(symbol.id)
              .then(images => [symbol.id, images] as const)
              .catch(() => [symbol.id, [] as CardImage[]] as const)
          )
        )
      })
      .then(imagePairs => {
        if (imagePairs) setImagesBySymbol(Object.fromEntries(imagePairs))
      })
      .catch(() => setLoading(false))
  }, [])

  const sortedSymbols = useMemo(() => {
    return [...symbols].sort((a, b) => {
      const lastA = getSightings(a.id, entries)[0]?.date || ''
      const lastB = getSightings(b.id, entries)[0]?.date || ''
      return lastB.localeCompare(lastA) || a.name.localeCompare(b.name)
    })
  }, [symbols, entries])

  const filteredSymbols = sortedSymbols.filter(symbol =>
    symbol.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = symbols.find(symbol => symbol.id === selectedId) || null
  const sightings = selected ? getSightings(selected.id, entries) : []
  const coSymbolIds = selected
    ? Object.entries(
        sightings.reduce<Record<string, number>>((acc, entry) => {
          entry.emergingSymbols?.forEach(symbolId => {
            if (symbolId !== selected.id) acc[symbolId] = (acc[symbolId] || 0) + 1
          })
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1]).map(([id]) => id)
    : []
  const relatedSymbolIds = selected
    ? [...new Set([...(selected.relatedSymbols || []), ...coSymbolIds])].slice(0, 8)
    : []
  const connectedCardIds = selected
    ? [...new Set([...(selected.connectedCards || []), ...sightings.map(entry => entry.cardId)])].filter(Boolean)
    : []
  const allNotes: TimestampedNote[] = selected
    ? [...(selected.fieldNotes || []), ...(selected.evolution || [])].sort((a, b) => a.date.localeCompare(b.date))
    : []
  const selectedUploadFilename = selected ? latestSymbolImage(imagesBySymbol[selected.id])?.filename : null
  const emergingSymbols = sortedSymbols.filter(symbol => {
    const count = getSightings(symbol.id, entries).length
    return count > 0 && count <= 3 && !symbol.poeticEssence
  })

  function updateLocal(next: TarotSymbol) {
    setSymbols(current => current.map(symbol => symbol.id === next.id ? next : symbol))
  }

  async function saveSymbol(next: TarotSymbol) {
    updateLocal(next)
    await api.symbols.update(next.id, next)
  }

  async function addSymbol() {
    const name = prompt('Name the symbol:')
    if (!name?.trim()) return
    const id = slugify(name)
    if (!id) return
    if (symbols.some(symbol => symbol.id === id)) {
      setSelectedId(id)
      toast('Already in the lexicon.')
      return
    }

    const next: TarotSymbol = {
      id,
      name: name.trim(),
      meaning: '',
      poeticEssence: '',
      voice: '',
      elementalQuality: '',
      season: '',
      recurringContexts: '',
      emotionalAssociations: [],
      connectedCards: [],
      appearances: [],
      evolution: [],
      fieldNotes: [],
      relatedSymbols: [],
      journalBacklinks: [],
    }
    setSymbols(current => [...current, next])
    setSelectedId(id)
    await api.symbols.update(id, next)
    toast('Symbol added ✓')
  }

  async function addEmotionalAssociation() {
    if (!selected || !emotionalInput.trim()) return
    const values = emotionalInput.split(',').map(s => s.trim()).filter(Boolean)
    const next = {
      ...selected,
      emotionalAssociations: [...new Set([...(selected.emotionalAssociations || []), ...values])],
    }
    setEmotionalInput('')
    await saveSymbol(next)
  }

  async function removeEmotionalAssociation(value: string) {
    if (!selected) return
    await saveSymbol({
      ...selected,
      emotionalAssociations: selected.emotionalAssociations.filter(item => item !== value),
    })
  }

  async function addRelatedSymbol() {
    if (!selected || !relatedInput.trim()) return
    const raw = relatedInput.trim()
    const relatedId = slugify(raw)
    if (!relatedId) return

    let nextSymbols = symbols
    if (!symbols.some(symbol => symbol.id === relatedId)) {
      const created: TarotSymbol = {
        id: relatedId,
        name: raw,
        meaning: '',
        poeticEssence: '',
        voice: '',
        elementalQuality: '',
        season: '',
        recurringContexts: '',
        emotionalAssociations: [],
        connectedCards: [],
        appearances: [],
        evolution: [],
        fieldNotes: [],
        relatedSymbols: [],
        journalBacklinks: [],
      }
      nextSymbols = [...symbols, created]
      setSymbols(nextSymbols)
      await api.symbols.update(relatedId, created)
    }

    const next = {
      ...selected,
      relatedSymbols: [...new Set([...(selected.relatedSymbols || []), relatedId])],
    }
    setRelatedInput('')
    await saveSymbol(next)
    toast('Linked ✓')
  }

  async function addFieldNote() {
    if (!selected || !fieldNoteInput.trim()) return
    const next = {
      ...selected,
      fieldNotes: [...(selected.fieldNotes || []), { text: fieldNoteInput.trim(), date: new Date().toISOString() }],
    }
    setFieldNoteInput('')
    setShowFieldNoteInput(false)
    await saveSymbol(next)
    toast('Field note recorded ✓')
  }

  async function uploadSymbolImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !selected) return
    event.target.value = ''
    try {
      await api.images.upload(selected.id, 'symbol', file)
      const images = await api.images.list(selected.id)
      setImagesBySymbol(current => ({ ...current, [selected.id]: images }))
      toast('Artwork uploaded ✓')
    } catch {
      toast('Artwork upload failed')
    }
  }

  function monthFrequency(symbolId: string) {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      const key = date.toISOString().slice(0, 7)
      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        count: entries.filter(entry => entry.date.startsWith(key) && entry.emergingSymbols?.includes(symbolId)).length,
      }
    })
  }

  if (loading) return <div className="loading">Loading symbol lexicon…</div>

  return (
    <>
      <div className="symbol-lex-header">
        <div>
          <h2>
            <img src="/images/symbol.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
            Symbol Lexicon
          </h2>
          <p>A living field guide to the symbols that recur, evolve, and shape your symbolic language.</p>
        </div>
        <div className="symbol-lex-actions">
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <button className="btn btn-primary" onClick={addSymbol}>+ New Symbol</button>
        </div>
      </div>

      <div className="lex-sym-strip">
        {filteredSymbols.length === 0 ? (
          <p style={{ color: 'var(--cream-muted)', fontStyle: 'italic', fontSize: 13, padding: '20px 0' }}>
            No symbols match that search.
          </p>
        ) : filteredSymbols.map(symbol => {
          const count = getSightings(symbol.id, entries).length
          const uploadFilename = latestSymbolImage(imagesBySymbol[symbol.id])?.filename
          return (
            <button
              key={symbol.id}
              className={`sym-strip-card${symbol.id === selectedId ? ' active' : ''}`}
              onClick={() => {
                setSelectedId(symbol.id)
                setShowFieldNoteInput(false)
              }}
            >
              <span className="sym-strip-vitality" style={{ width: `${symbolVitality(symbol, count) / 30 * 100}%` }} />
              <span className="sym-strip-icon">
                <SymbolLexiconImg
                  symbolId={symbol.id}
                  uploadFilename={uploadFilename}
                  alt=""
                  fallback={<span style={{ opacity: .25 }}>◈</span>}
                />
              </span>
              <span className="sym-strip-name">{symbol.name}</span>
              <span className="sym-strip-count">{count}×</span>
            </button>
          )
        })}
      </div>

      {!selected ? (
        <div className="symbol-empty">
          <img src="/images/symbol.png" alt="" />
          <p>Name a symbol and it will begin to grow.</p>
          <button className="btn" onClick={addSymbol}>+ New Symbol</button>
        </div>
      ) : (
        <div className="sym-archive-grid">
          <div className="sym-art-col">
            <button className="sym-art-area" onClick={() => fileInputRef.current?.click()}>
              <SymbolLexiconImg
                symbolId={selected.id}
                uploadFilename={selectedUploadFilename}
                alt={selected.name}
                fallback={<span style={{ fontSize: 36, opacity: .12 }}>◈</span>}
              />
              <span className="sym-art-hint">click to upload artwork</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadSymbolImage} />
            <div className="sym-art-caption">
              <h2>{selected.name}</h2>
              <div>✦</div>
              {selected.elementalQuality && <p>{selected.elementalQuality}</p>}
              <span>
                {sightings.length > 0
                  ? `${sightings.length}× · first ${fmtShort(sightings[sightings.length - 1].date)}`
                  : 'not yet sighted'}
              </span>
            </div>
          </div>

          <div>
            <div className="detail-card">
              <div className="detail-label">Core Resonance</div>
              <textarea
                rows={3}
                placeholder="Not a definition - a resonance. What does this symbol carry?"
                value={selected.poeticEssence || selected.meaning || ''}
                onChange={event => updateLocal({ ...selected, poeticEssence: event.target.value, meaning: event.target.value })}
                onBlur={event => saveSymbol({ ...selected, poeticEssence: event.target.value, meaning: event.target.value })}
              />
            </div>

            <div className="detail-card">
              <div className="detail-label">Emotional Atmosphere</div>
              <div style={{ marginBottom: 9 }}>
                {selected.emotionalAssociations.length > 0 ? selected.emotionalAssociations.map(value => (
                  <button key={value} className="tag tag-rose symbol-tag-button" onClick={() => removeEmotionalAssociation(value)}>
                    {value} ×
                  </button>
                )) : <em style={{ fontSize: 12, color: 'var(--cream-muted)' }}>None yet.</em>}
              </div>
              <div className="symbol-inline-add">
                <input
                  type="text"
                  value={emotionalInput}
                  placeholder="Add a quality, press Enter..."
                  onChange={event => setEmotionalInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') addEmotionalAssociation()
                  }}
                />
                <button className="btn btn-sm" onClick={addEmotionalAssociation}>+</button>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-label">Recurring Contexts</div>
              <textarea
                rows={3}
                placeholder="When does this symbol appear? What questions or states does it accompany?"
                value={selected.recurringContexts || ''}
                onChange={event => updateLocal({ ...selected, recurringContexts: event.target.value })}
                onBlur={event => saveSymbol({ ...selected, recurringContexts: event.target.value })}
              />
            </div>

            <div className="detail-card">
              <div className="detail-label">Related Symbols</div>
              {relatedSymbolIds.length > 0 ? (
                <div className="rel-sym-row">
                  {relatedSymbolIds.map(symbolId => {
                    const uploadFilename = latestSymbolImage(imagesBySymbol[symbolId])?.filename
                    return (
                      <button key={symbolId} className="rel-sym-node" onClick={() => setSelectedId(symbolId)}>
                        <span className="rel-sym-node-icon">
                          <SymbolLexiconImg
                            symbolId={symbolId}
                            uploadFilename={uploadFilename}
                            alt=""
                            fallback={<span style={{ opacity: .25, fontSize: 9 }}>◈</span>}
                          />
                        </span>
                        <span className="rel-sym-node-name">{symbolName(symbolId, symbols)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--cream-muted)', fontStyle: 'italic', marginBottom: 9 }}>
                  Correspondences emerge as you journal. Add intuited links below.
                </p>
              )}
              <div className="symbol-inline-add">
                <input
                  type="text"
                  value={relatedInput}
                  placeholder="Link a symbol by name..."
                  onChange={event => setRelatedInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') addRelatedSymbol()
                  }}
                />
                <button className="btn btn-sm" onClick={addRelatedSymbol}>+</button>
              </div>
            </div>

            {connectedCardIds.length > 0 && (
              <div className="detail-card">
                <div className="detail-label">Related Cards</div>
                <div className="symbol-card-tags">
                  {connectedCardIds.map(cardId => {
                    const card = CARD_MAP[cardId]
                    if (!card) return null
                    return (
                      <Link key={cardId} to={`/living-arcana/${cardId}`} className="symbol-card-tag">
                        <span style={{ background: SUIT_COLOR[card.suit] }} />
                        {card.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="detail-card">
              <div className="detail-label symbol-label-row">
                <span>Field Notes</span>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowFieldNoteInput(open => !open)}>+ Add</button>
              </div>
              {showFieldNoteInput && (
                <div style={{ marginBottom: 12 }}>
                  <textarea
                    rows={3}
                    placeholder="An observation, a shift, a question..."
                    value={fieldNoteInput}
                    onChange={event => setFieldNoteInput(event.target.value)}
                  />
                  <button className="btn btn-sm btn-primary" style={{ marginTop: 6 }} onClick={addFieldNote}>Save Note</button>
                </div>
              )}
              {allNotes.length > 0 ? [...allNotes].reverse().map((note, index) => (
                <div key={`${note.date}-${index}`} className="field-note">
                  <div className="field-note-date">Observation {allNotes.length - index} · {fmt(note.date)}</div>
                  <div className="field-note-text">{note.text}</div>
                </div>
              )) : <p style={{ fontSize: 12, color: 'var(--cream-muted)', fontStyle: 'italic' }}>No field notes yet.</p>}
            </div>
          </div>

          <div>
            <div className="detail-card">
              <div className="detail-label">Symbol Relationships</div>
              <RelationshipGraph selected={selected} relatedSymbolIds={relatedSymbolIds} symbols={symbols} onSelect={setSelectedId} />
            </div>

            <div className="detail-card">
              <div className="detail-label">Appearance History</div>
              {sightings.length > 0 ? (
                <>
                  <div className="first-appearance">
                    <div>First Appeared</div>
                    <strong>{fmt(sightings[sightings.length - 1].date)}</strong>
                    <span>{sightings[sightings.length - 1].cardName}</span>
                  </div>
                  {sightings.slice(0, 6).map(entry => (
                    <Link key={entry.id} to={`/journal/${entry.id}`} className="appear-row">
                      <span className="appear-date">{fmtShort(entry.date)}</span>
                      <span className="appear-card">{entry.cardName || '?'}</span>
                    </Link>
                  ))}
                  {sightings.length > 6 && <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 8, fontStyle: 'italic' }}>+ {sightings.length - 6} more</div>}
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--cream-muted)', fontStyle: 'italic' }}>Not yet sighted in pulls.</p>
              )}
            </div>

            <div className="detail-card">
              <div className="detail-label">Frequency</div>
              <FrequencyBars months={monthFrequency(selected.id)} />
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 8 }}>
                Seen in {sightings.length} pull{sightings.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-label">The Voice</div>
              <textarea
                rows={3}
                placeholder='"I am the light that arrives too late..."'
                value={selected.voice || ''}
                onChange={event => updateLocal({ ...selected, voice: event.target.value })}
                onBlur={event => saveSymbol({ ...selected, voice: event.target.value })}
              />
            </div>

            <div className="detail-card">
              <div className="detail-label">Qualities</div>
              <div className="symbol-quality-row">
                <div>
                  <div>Element</div>
                  <input
                    type="text"
                    value={selected.elementalQuality || ''}
                    placeholder="liminal fire..."
                    onChange={event => updateLocal({ ...selected, elementalQuality: event.target.value })}
                    onBlur={event => saveSymbol({ ...selected, elementalQuality: event.target.value })}
                  />
                </div>
                <div>
                  <div>Season</div>
                  <input
                    type="text"
                    value={selected.season || ''}
                    placeholder="late autumn..."
                    onChange={event => updateLocal({ ...selected, season: event.target.value })}
                    onBlur={event => saveSymbol({ ...selected, season: event.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {emergingSymbols.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="emerging-header">
            <h3>Emerging Symbols</h3>
            <div />
            <span>{emergingSymbols.length} new</span>
          </div>
          <div className="emerging-strip">
            {emergingSymbols.map(symbol => {
              const count = getSightings(symbol.id, entries).length
              const uploadFilename = latestSymbolImage(imagesBySymbol[symbol.id])?.filename
              return (
                <button key={symbol.id} className="emerging-card" onClick={() => setSelectedId(symbol.id)}>
                  <span className="emerging-card-icon">
                    <SymbolLexiconImg
                      symbolId={symbol.id}
                      uploadFilename={uploadFilename}
                      alt=""
                      fallback={<span style={{ opacity: .25 }}>◈</span>}
                    />
                  </span>
                  <span>
                    <strong>{symbol.name}</strong>
                    <small>Appearing in {count} pull{count === 1 ? '' : 's'}</small>
                    {symbol.emotionalAssociations.slice(0, 3).length > 0 && (
                      <em>{symbol.emotionalAssociations.slice(0, 3).join(', ')}</em>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

function FrequencyBars({ months }: { months: { label: string; count: number }[] }) {
  const max = Math.max(1, ...months.map(month => month.count))
  return (
    <div className="freq-bars">
      {months.map(month => (
        <div key={month.label} className="freq-bar-col">
          <div
            className="freq-bar"
            style={{
              height: Math.max(month.count ? 2 : 0, Math.round(month.count / max * 36)),
              opacity: month.count ? 1 : .15,
            }}
          />
          <div className="freq-bar-lbl">{month.label}</div>
        </div>
      ))}
    </div>
  )
}

function RelationshipGraph({
  selected,
  relatedSymbolIds,
  symbols,
  onSelect,
}: {
  selected: TarotSymbol
  relatedSymbolIds: string[]
  symbols: TarotSymbol[]
  onSelect: (id: string) => void
}) {
  if (relatedSymbolIds.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--cream-muted)', fontStyle: 'italic' }}>No relationships yet - they emerge from your pulls.</p>
  }

  const width = 178
  const height = 178
  const centerX = 89
  const centerY = 89
  const radius = 60

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="symbol-rel-svg">
      {relatedSymbolIds.map((symbolId, index) => {
        const angle = index * ((2 * Math.PI) / relatedSymbolIds.length) - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        const name = symbolName(symbolId, symbols).slice(0, 7)
        return (
          <g key={symbolId} onClick={() => onSelect(symbolId)}>
            <line x1={centerX} y1={centerY} x2={x} y2={y} />
            <circle cx={x} cy={y} r="13" className="outer-node" />
            <text x={x} y={y + 3.5} textAnchor="middle">{name}</text>
          </g>
        )
      })}
      <circle cx={centerX} cy={centerY} r="19" className="center-node" />
      <text x={centerX} y={centerY + 4} textAnchor="middle" className="center-label">{selected.name.slice(0, 7)}</text>
    </svg>
  )
}
