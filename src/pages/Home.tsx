import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { CARD_MAP, SUIT_COLOR } from '../lib/cards'
import { calcStreak, fmt, fmtShort, today } from '../lib/utils'
import type { CardImage, JournalEntry } from '../types'

export default function Home() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.entries.list().then(e => { setEntries(e); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading observatory…</div>

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const todayEntry = sorted.find(e => e.date === today())
  const streak = calcStreak(entries)

  const freq: Record<string, number> = {}
  entries.forEach(e => { if (e.cardId) freq[e.cardId] = (freq[e.cardId] || 0) + 1 })
  const topCardId = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0]
  const topCardName = topCardId ? (CARD_MAP[topCardId]?.name.split(' ').pop() ?? '—') : '—'

  const recent = sorted.slice(0, 6)

  return (
    <>
      <div className="page-header">
        <h2>✦ The Observatory</h2>
        <p>Your living symbolic atlas — {fmt(new Date().toISOString())}</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="panel panel-sm stat-item">
          <div className="num">{entries.length}</div>
          <div className="lbl">Entries</div>
        </div>
        <div className="panel panel-sm stat-item">
          <div className="num">{streak}</div>
          <div className="lbl">Day Streak</div>
        </div>
        <div className="panel panel-sm stat-item">
          <div className="num" style={{ fontSize: 16, paddingTop: 4 }}>{topCardName}</div>
          <div className="lbl">Most Drawn</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="panel">
          <h3>Today's Card</h3>
          <TodayCard entry={todayEntry} />
        </div>
        <div className="panel">
          <h3>Recent Pulls</h3>
          {entries.length === 0 ? (
            <p style={{ color: 'var(--cream-muted)', fontSize: 13, padding: '10px 0' }}>
              Your archive awaits its first entry.
            </p>
          ) : (
            <>
              <div className="entry-list-header">
                <span>Date</span><span>Card</span><span>Orient.</span><span>Themes</span><span></span>
              </div>
              {recent.map(e => <RecentRow key={e.id} entry={e} />)}
              <div style={{ marginTop: 12 }}>
                <Link to="/journal" className="btn btn-sm btn-ghost">View all entries →</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Quick Links</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            <Link to="/journal/new" className="btn btn-sm">+ New Entry</Link>
            <Link to="/cards" className="btn btn-sm">Card Library</Link>
            <Link to="/symbols" className="btn btn-sm">Symbol Lexicon</Link>
            <Link to="/attunement" className="btn btn-sm">Attunement</Link>
          </div>
        </div>
        <div className="panel">
          <h3>Symbol Pulse</h3>
          <SymbolPulse entries={entries} />
        </div>
      </div>
    </>
  )
}

function TodayCard({ entry }: { entry?: JournalEntry }) {
  const [cardImages, setCardImages] = useState<CardImage[]>([])

  useEffect(() => {
    if (!entry?.cardId) {
      setCardImages([])
      return
    }

    let cancelled = false
    api.images.list(entry.cardId)
      .then(images => {
        if (!cancelled) setCardImages(images)
      })
      .catch(() => {
        if (!cancelled) setCardImages([])
      })

    return () => {
      cancelled = true
    }
  }, [entry?.cardId])

  if (!entry) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: .4 }}>☽</div>
        <p style={{ color: 'var(--cream-muted)', marginBottom: 16 }}>No pull recorded for today.</p>
        <Link to="/journal/new" className="btn btn-primary">Pull Card</Link>
      </div>
    )
  }

  const card = CARD_MAP[entry.cardId]
  const suit = card?.suit || 'major'
  const latestImage = cardImages.length > 0 ? cardImages[cardImages.length - 1] : null

  return (
    <div className="today-card">
      {latestImage ? (
        <img
          className="today-card-image"
          src={`/images/${latestImage.filename}`}
          alt={latestImage.caption || entry.cardName}
        />
      ) : (
        <div className="card-placeholder" style={{ borderColor: SUIT_COLOR[suit] }}>☽</div>
      )}
      <div className="today-card-info">
        <h3>{entry.cardName}</h3>
        <span className="orientation-badge">{entry.orientation}</span>
        <div style={{ marginBottom: 8 }}>
          <span className={`tag tag-suit-${suit}`}>{suit}</span>
        </div>
        {entry.primaryThemes && (
          <p style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 8 }}>
            <em>{entry.primaryThemes}</em>
          </p>
        )}
        {entry.psychologicalThemes?.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--cream-muted)' }}>
            {entry.psychologicalThemes.join(', ')}
          </p>
        )}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link to={`/journal/${entry.id}`} className="btn btn-sm">Full Entry</Link>
          <Link to={`/cards/${entry.cardId}`} className="btn btn-sm">Card Page</Link>
        </div>
      </div>
    </div>
  )
}

function RecentRow({ entry }: { entry: JournalEntry }) {
  const card = CARD_MAP[entry.cardId]
  return (
    <Link to={`/journal/${entry.id}`} className="entry-row" style={{ textDecoration: 'none' }}>
      <span className="e-date">{fmtShort(entry.date)}</span>
      <span className="e-card">
        {entry.cardName}
        {card && (
          <span style={{ fontSize: 10, color: SUIT_COLOR[card.suit], marginLeft: 4 }}>◆</span>
        )}
      </span>
      <span className="e-orient">{entry.orientation}</span>
      <span className="e-insight">
        {entry.primaryThemes || entry.personalReflection?.slice(0, 55) || '—'}
      </span>
      <span className="e-arrow">›</span>
    </Link>
  )
}

function SymbolPulse({ entries }: { entries: JournalEntry[] }) {
  const freq: Record<string, number> = {}
  entries.forEach(e => (e.emergingSymbols || []).forEach(s => { freq[s] = (freq[s] || 0) + 1 }))
  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 8)

  if (!sorted.length) {
    return <p style={{ color: 'var(--cream-muted)', fontSize: 13 }}>No symbols tracked yet.</p>
  }

  const max = freq[sorted[0]] || 1
  return (
    <div>
      {sorted.map(s => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: 'var(--cream-dim)', minWidth: 80 }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
          <div className="theme-bar-wrap">
            <div className="theme-bar" style={{ width: `${Math.round(freq[s] / max * 100)}%` }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--cream-muted)', minWidth: 20 }}>{freq[s]}</span>
        </div>
      ))}
    </div>
  )
}
