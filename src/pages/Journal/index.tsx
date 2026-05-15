import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { CARD_MAP, SUIT_COLOR } from '../../lib/cards'
import { fmtShort } from '../../lib/utils'
import type { JournalEntry, Theme } from '../../types'

interface Filters {
  suit: string
  symbol: string
  theme: string
  search: string
}

export default function JournalList() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [filters, setFilters] = useState<Filters>({ suit: '', symbol: '', theme: '', search: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.entries.list(), api.themes.list()]).then(([e, t]) => {
      setEntries(e)
      setThemes(t)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading">Loading journal…</div>

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  const filtered = sorted.filter(e => {
    const card = CARD_MAP[e.cardId]
    if (filters.suit && card?.suit !== filters.suit) return false
    if (filters.symbol && !(e.emergingSymbols || []).includes(filters.symbol)) return false
    if (filters.theme && !(e.psychologicalThemes || []).includes(filters.theme)) return false
    if (filters.search) {
      const s = filters.search.toLowerCase()
      if (
        !e.cardName?.toLowerCase().includes(s) &&
        !e.personalReflection?.toLowerCase().includes(s) &&
        !e.primaryThemes?.toLowerCase().includes(s)
      ) return false
    }
    return true
  })

  const usedSymbols = [...new Set(entries.flatMap(e => e.emergingSymbols || []))].sort()
  const usedThemes = [...new Set(entries.flatMap(e => e.psychologicalThemes || []))].sort()

  function set(key: keyof Filters, val: string) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>📖 Daily Journal</h2>
          <p>{filtered.length} of {entries.length} entries</p>
        </div>
        <Link to="/journal/new" className="btn btn-primary">+ New Entry</Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search entries…"
          style={{ maxWidth: 180 }}
          value={filters.search}
          onChange={e => set('search', e.target.value)}
        />
        <select value={filters.suit} onChange={e => set('suit', e.target.value)}>
          <option value="">All suits</option>
          <option value="major">Major Arcana</option>
          <option value="wands">Wands</option>
          <option value="cups">Cups</option>
          <option value="swords">Swords</option>
          <option value="pentacles">Pentacles</option>
        </select>
        <select value={filters.symbol} onChange={e => set('symbol', e.target.value)}>
          <option value="">All symbols</option>
          {usedSymbols.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={filters.theme} onChange={e => set('theme', e.target.value)}>
          <option value="">All themes</option>
          {usedThemes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div className="entry-list-header">
          <span>Date</span><span>Card</span><span>Orient.</span><span>Primary Themes</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--cream-muted)', fontSize: 13 }}>
            No entries match these filters.
          </p>
        ) : (
          filtered.map(e => <EntryRow key={e.id} entry={e} />)
        )}
      </div>

      {/* suppress unused var */}
      <div style={{ display: 'none' }}>{themes.length}</div>
    </>
  )
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const card = CARD_MAP[entry.cardId]
  return (
    <Link to={`/journal/${entry.id}`} className="entry-row" style={{ textDecoration: 'none' }}>
      <span className="e-date">{fmtShort(entry.date)}</span>
      <span className="e-card">
        {entry.cardName}
        {card && <span style={{ fontSize: 10, color: SUIT_COLOR[card.suit], marginLeft: 4 }}>◆</span>}
      </span>
      <span className="e-orient">{entry.orientation}</span>
      <span className="e-insight">{entry.primaryThemes || entry.personalReflection?.slice(0, 55) || '—'}</span>
      <span className="e-arrow">›</span>
    </Link>
  )
}
