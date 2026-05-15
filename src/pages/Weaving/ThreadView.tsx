import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { fmt } from '../../lib/utils'
import { useToast } from '../../contexts/ToastContext'
import type { WeavingThread } from '../../types'

export default function ThreadView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [thread, setThread] = useState<WeavingThread | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.weaving.get(id)
      .then(t => { setThread(t); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!thread || !confirm(`Remove "${thread.title}"?`)) return
    await api.weaving.delete(thread.id)
    toast('Thread removed')
    navigate('/living-thread')
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!thread) return (
    <div>
      <p style={{ color: 'var(--cream-muted)' }}>Thread not found.</p>
      <Link to="/living-thread" className="btn" style={{ marginTop: 12, display: 'inline-block' }}>Back to The Living Thread</Link>
    </div>
  )

  const paragraphs = thread.body.split('\n\n').filter(Boolean)

  return (
    <>
      <div className="breadcrumb">
        <Link to="/living-thread">The Living Thread</Link> › {thread.title}
      </div>

      {/* ── Header ── */}
      <div style={{ maxWidth: 680, margin: '0 auto 36px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 26, color: 'var(--gold)', marginBottom: 6 }}>{thread.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--cream-muted)', margin: 0 }}>
              {fmt(thread.createdAt.split('T')[0])} · drawn from {thread.entryCount} {thread.entryCount === 1 ? 'entry' : 'entries'}
            </p>
            {thread.focus && (
              <p style={{ fontSize: 12, color: 'var(--gold-dim)', marginTop: 4, marginBottom: 0, fontStyle: 'italic' }}>
                {thread.focus}
              </p>
            )}
          </div>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>Remove</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 640, margin: '0 auto 48px', width: '100%' }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{
            fontSize: 15.5,
            lineHeight: 1.9,
            color: 'var(--cream-dim)',
            marginBottom: 26,
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.01em',
          }}>
            {p}
          </p>
        ))}
      </div>

      {/* ── Ornament ── */}
      <div style={{ maxWidth: 640, margin: '0 auto 40px', width: '100%', textAlign: 'center', color: 'var(--gold-dim)', letterSpacing: 12, fontSize: 12 }}>
        ✦ · · · ✦
      </div>

      {/* ── Symbolic Echoes ── */}
      {thread.threads.length > 0 && (
        <div style={{ maxWidth: 720, margin: '0 auto 40px', width: '100%' }}>
          <h3 style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16 }}>
            Symbolic Echoes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {thread.threads.map(th => (
              <div key={th.label} className="panel" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', marginBottom: 6, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  {th.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--cream-muted)', lineHeight: 1.65, fontFamily: 'Georgia, serif' }}>
                  {th.observation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Observed across ── */}
      {(thread.cardsObserved.length > 0 || thread.symbolsObserved.length > 0) && (
        <div style={{ maxWidth: 720, margin: '0 auto 48px', width: '100%' }}>
          <h3 style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 14 }}>
            Moving Through
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {thread.cardsObserved.map(c => (
              <span key={c} className="tag" style={{ color: 'var(--cream-dim)', borderColor: 'var(--border)' }}>{c}</span>
            ))}
            {thread.symbolsObserved.map(s => (
              <span key={s} className="tag tag-indigo">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto 48px', width: '100%' }}>
        <Link to="/living-thread" className="btn btn-sm">← Back to The Living Thread</Link>
      </div>
    </>
  )
}
