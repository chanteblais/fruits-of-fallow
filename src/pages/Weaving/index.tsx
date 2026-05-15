import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { fmt } from '../../lib/utils'
import { useToast } from '../../contexts/ToastContext'
import type { WeavingThread } from '../../types'

export default function LivingThread() {
  const { toast } = useToast()
  const [threads, setThreads] = useState<WeavingThread[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [focus, setFocus] = useState('')
  const [maxEntries, setMaxEntries] = useState(20)
  const [showForm, setShowForm] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    api.weaving.list().then(t => { setThreads(t); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setApiError(null)
    try {
      const thread = await api.weaving.synthesize(focus.trim() || undefined, maxEntries)
      setThreads(prev => [thread, ...prev])
      setFocus('')
      setShowForm(false)
      toast('New thread drawn ✦')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('503') || msg.includes('ANTHROPIC_API_KEY')) {
        setApiError('ANTHROPIC_API_KEY is not set. Add it to your .env file and restart the server.')
      } else if (msg.includes('400')) {
        toast('No journal entries yet — add some pulls first')
      } else {
        toast('Failed to draw the thread — check server logs')
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Remove "${title}"?`)) return
    await api.weaving.delete(id)
    setThreads(prev => prev.filter(t => t.id !== id))
  }

  const excerpt = (body: string) => {
    const first = body.split('\n\n')[0] || body
    return first.length > 240 ? first.slice(0, 240) + '…' : first
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/images/living_thread.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
            Living Thread
          </h2>
          <p>The mythic layer — what story is emerging through these encounters?</p>
        </div>
        <button className="btn" onClick={() => setShowForm(f => !f)} disabled={generating}>
          {showForm ? 'Cancel' : '✦ Draw Thread'}
        </button>
      </div>

      {/* ── API Key notice ── */}
      {apiError && (
        <div className="panel" style={{ borderColor: 'var(--gold-dim)', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--cream-muted)', margin: 0 }}>
            <strong style={{ color: 'var(--gold)' }}>Setup required</strong><br />
            {apiError}
          </p>
          <p style={{ fontSize: 12, color: 'var(--cream-muted)', marginTop: 8, marginBottom: 0 }}>
            In <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 3 }}>.env</code>: add <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 3 }}>ANTHROPIC_API_KEY=sk-ant-...</code> and restart.
          </p>
        </div>
      )}

      {/* ── Generate form ── */}
      {showForm && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <label style={{ marginTop: 0 }}>What is asking to be seen?</label>
          <input
            type="text"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            placeholder="Leave blank for open observation, or ask: 'what is gathering around thresholds', 'where is fire appearing'…"
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ marginTop: 0, fontSize: 12, color: 'var(--cream-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Draw from last
              <input
                type="number"
                min={3}
                max={50}
                value={maxEntries}
                onChange={e => setMaxEntries(Number(e.target.value))}
                style={{ width: 56, textAlign: 'center' }}
              />
              entries
            </label>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Reading the pattern…' : '✦ Draw'}
            </button>
          </div>
          {generating && (
            <p style={{ fontSize: 12, color: 'var(--cream-muted)', marginTop: 12, marginBottom: 0, fontStyle: 'italic' }}>
              Observing what is moving through the entries — this takes a moment…
            </p>
          )}
        </div>
      )}

      {/* ── Thread list ── */}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : threads.length === 0 ? (
        <div className="stub-notice" style={{ paddingTop: 48 }}>
          <div style={{ fontSize: 28, marginBottom: 16, color: 'var(--gold-dim)', letterSpacing: 8 }}>✦ · · · ✦</div>
          <p style={{ maxWidth: 480, textAlign: 'center', lineHeight: 1.8 }}>
            Living Thread begins when there are entries to read.<br />
            Add a few journal pulls, then click <strong>✦ Draw Thread</strong> to observe<br />
            what story is beginning to emerge.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780 }}>
          {threads.map(t => (
            <div key={t.id} className="panel" style={{ position: 'relative' }}>
              <Link to={`/living-thread/${t.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 17, color: 'var(--gold)', fontWeight: 600 }}>{t.title}</h3>
                  <span style={{ fontSize: 11, color: 'var(--cream-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                    {fmt(t.createdAt.split('T')[0])} · {t.entryCount} {t.entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                {t.focus && (
                  <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 6, fontStyle: 'italic' }}>
                    {t.focus}
                  </div>
                )}
                <p style={{ fontSize: 13, color: 'var(--cream-dim)', margin: '0 0 10px', lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>
                  {excerpt(t.body)}
                </p>
                {t.threads.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {t.threads.slice(0, 6).map(th => (
                      <span key={th.label} className="tag tag-gold">{th.label}</span>
                    ))}
                    {t.threads.length > 6 && (
                      <span className="tag" style={{ color: 'var(--cream-muted)' }}>+{t.threads.length - 6}</span>
                    )}
                  </div>
                )}
              </Link>
              <button
                onClick={() => handleDelete(t.id, t.title)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'none', border: 'none', color: 'var(--cream-muted)',
                  cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px', opacity: 0.4,
                }}
                title="Remove"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
