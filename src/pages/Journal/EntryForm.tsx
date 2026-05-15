import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CARDS_78, TRAD } from '../../lib/cards'
import { today, uid } from '../../lib/utils'
import { useToast } from '../../contexts/ToastContext'
import type { CardImage, JournalEntry, Symbol, Theme } from '../../types'

async function parseTxt(file: File): Promise<Record<string, string>> {
  const body = new FormData()
  body.append('pdf', file)
  const res = await fetch('/api/parse-pdf', { method: 'POST', body })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

type FormValues = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>

const EMPTY: FormValues = {
  date: today(),
  cardId: '',
  cardName: '',
  suit: '',
  orientation: 'upright',
  primaryThemes: '',
  traditionalMeaning: '',
  personalReflection: '',
  howAppeared: '',
  quotesInsights: '',
  emergingSymbols: [],
  visualDirection: '',
  psychologicalThemes: [],
  guidebookNotes: '',
}

export default function EntryForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState<FormValues>(EMPTY)
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [tradDisplay, setTradDisplay] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [cardImages, setCardImages] = useState<CardImage[]>([])
  const [imgUploading, setImgUploading] = useState(false)
  const [imgCaption, setImgCaption] = useState('')
  const [imgIteration, setImgIteration] = useState('')
  const createdAt = useRef<string>(new Date().toISOString())

  useEffect(() => {
    Promise.all([api.symbols.list(), api.themes.list()]).then(([s, t]) => {
      setSymbols(s)
      setThemes(t)
    })
    if (id) {
      api.entries.get(id).then(e => {
        setForm({
          date: e.date, cardId: e.cardId, cardName: e.cardName, suit: e.suit,
          orientation: e.orientation, primaryThemes: e.primaryThemes,
          traditionalMeaning: e.traditionalMeaning,
          personalReflection: e.personalReflection, howAppeared: e.howAppeared,
          quotesInsights: e.quotesInsights,
          emergingSymbols: e.emergingSymbols || [],
          visualDirection: e.visualDirection,
          psychologicalThemes: e.psychologicalThemes || [],
          guidebookNotes: e.guidebookNotes,
        })
        createdAt.current = e.createdAt
        if (e.cardId && TRAD[e.cardId]) setTradDisplay(TRAD[e.cardId])
        if (e.cardId) loadCardImages(e.cardId)
      })
    }
  }, [id])

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function loadCardImages(cardId: string) {
    if (!cardId) { setCardImages([]); return }
    api.images.list(cardId).then(setCardImages).catch(() => {})
  }

  function onCardChange(cardId: string) {
    const card = CARDS_78.find(c => c.id === cardId)
    set('cardId', cardId)
    set('cardName', card?.name || '')
    set('suit', card?.suit || '')
    setTradDisplay(TRAD[cardId] || '')
    loadCardImages(cardId)
  }

  async function handlePdfImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPdfLoading(true)
    try {
      const parsed = await parseTxt(file)

      // Match card name to a card ID
      if (parsed.cardName) {
        const match = CARDS_78.find(c =>
          c.name.toLowerCase() === parsed.cardName.toLowerCase()
        )
        if (match) {
          parsed.cardId = match.id
          parsed.cardName = match.name
          parsed.suit = match.suit
          if (TRAD[match.id]) setTradDisplay(TRAD[match.id])
        }
      }

      // Normalise orientation
      if (parsed.orientation) {
        const o = parsed.orientation.toLowerCase()
        parsed.orientation = o.includes('rev') ? 'reversed' : 'upright'
      }

      setForm(f => ({
        ...f,
        ...(parsed.date               && { date: parsed.date }),
        ...(parsed.cardId             && { cardId: parsed.cardId }),
        ...(parsed.cardName           && { cardName: parsed.cardName }),
        ...(parsed.suit               && { suit: parsed.suit }),
        ...(parsed.orientation        && { orientation: parsed.orientation as 'upright' | 'reversed' }),
        ...(parsed.primaryThemes      && { primaryThemes: parsed.primaryThemes }),
        ...(parsed.traditionalMeaning && { traditionalMeaning: parsed.traditionalMeaning }),
        ...(parsed.personalReflection && { personalReflection: parsed.personalReflection }),
        ...(parsed.howAppeared        && { howAppeared: parsed.howAppeared }),
        ...(parsed.quotesInsights     && { quotesInsights: parsed.quotesInsights }),
        ...(parsed.emergingSymbols    && { emergingSymbols: parsed.emergingSymbols.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) }),
        ...(parsed.visualDirection    && { visualDirection: parsed.visualDirection }),
        ...(parsed.psychologicalThemes && { psychologicalThemes: parsed.psychologicalThemes.split(',').map(s => s.trim()).filter(Boolean) }),
        ...(parsed.guidebookNotes     && { guidebookNotes: parsed.guidebookNotes }),
      }))

      toast('Entry imported — review and save ✓')
    } catch {
      toast('Could not read file — make sure it is a .txt journal template')
    } finally {
      setPdfLoading(false)
    }
  }

  function toggle(field: 'emergingSymbols' | 'psychologicalThemes', val: string) {
    const arr = form[field] as string[]
    set(field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  async function handleSave() {
    if (!form.cardId) { toast('Please select a card.'); return }
    const entry: JournalEntry = {
      ...form,
      id: id || uid(),
      createdAt: createdAt.current,
      updatedAt: new Date().toISOString(),
    }
    try {
      if (id) {
        await api.entries.update(id, entry)
      } else {
        await api.entries.create(entry)
      }
      toast('Entry saved ✓')
      navigate(`/journal/${entry.id}`)
    } catch {
      toast('Save failed — please try again')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !form.cardId) return
    e.target.value = ''
    setImgUploading(true)
    try {
      await api.images.upload(form.cardId, 'card', file, imgCaption, imgIteration)
      setImgCaption('')
      setImgIteration('')
      loadCardImages(form.cardId)
      toast('Artwork added to card library ✓')
    } catch {
      toast('Image upload failed — please try again')
    } finally {
      setImgUploading(false)
    }
  }

  async function handleImageDelete(imgId: string) {
    await api.images.delete(imgId)
    setCardImages(imgs => imgs.filter(i => i.id !== imgId))
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this entry?')) return
    await api.entries.delete(id)
    toast('Entry deleted')
    navigate('/journal')
  }

  return (
    <>
      <div className="breadcrumb">
        <Link to="/journal">Journal</Link> › {id ? 'Edit Entry' : 'New Entry'}
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2>{id ? 'Edit Entry' : 'Log a Pull'}</h2>
        <label style={{ margin: 0 }}>
          <input
            type="file"
            accept=".txt"
            onChange={handlePdfImport}
            style={{ display: 'none' }}
          />
          <span
            className="btn btn-sm btn-ghost"
            style={{ cursor: 'pointer', opacity: pdfLoading ? 0.5 : 1 }}
          >
            {pdfLoading ? 'Reading…' : '↑ Import'}
          </span>
        </label>
        <a href="/api/journal-template" download="daily-pull-journal.txt" className="btn btn-sm btn-ghost">↓ Template</a>
      </div>

      <div style={{ maxWidth: 720 }}>

        {/* ── Date · Card · Orientation · Primary Themes ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="form-row">
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label>Card</label>
              <select value={form.cardId} onChange={e => onCardChange(e.target.value)}>
                <option value="">— select —</option>
                {CARDS_78.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <div>
              <label>Orientation</label>
              <select value={form.orientation} onChange={e => set('orientation', e.target.value as 'upright' | 'reversed')}>
                <option value="upright">Upright</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
            <div>
              <label>Primary Themes</label>
              <input
                type="text"
                value={form.primaryThemes}
                onChange={e => set('primaryThemes', e.target.value)}
                placeholder="e.g. surrender, threshold, the veil"
              />
            </div>
          </div>
        </div>

        {/* ── Traditional Meaning ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          {tradDisplay && (
            <div style={{ fontSize: 12, color: 'var(--cream-muted)', marginBottom: 10, fontStyle: 'italic' }}>
              {tradDisplay}
            </div>
          )}
          <label style={{ marginTop: 0 }}>Traditional Meaning</label>
          <textarea
            rows={3}
            value={form.traditionalMeaning}
            onChange={e => set('traditionalMeaning', e.target.value)}
            placeholder="Record the traditional meaning in your own words…"
          />
        </div>

        {/* ── Personal Reflection ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>Personal Reflection</label>
          <textarea
            rows={5}
            value={form.personalReflection}
            onChange={e => set('personalReflection', e.target.value)}
            placeholder="What arose for you? What does this card mean to you today?"
          />
        </div>

        {/* ── How the Card Appeared Today ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>How the Card Appeared Today</label>
          <textarea
            rows={4}
            value={form.howAppeared}
            onChange={e => set('howAppeared', e.target.value)}
            placeholder="Where did you see this energy? In what circumstances?"
          />
        </div>

        {/* ── Quotes & Insights ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>Quotes & Insights</label>
          <textarea
            rows={3}
            value={form.quotesInsights}
            onChange={e => set('quotesInsights', e.target.value)}
            placeholder="Lines from books, songs, or your own words that landed…"
          />
        </div>

        {/* ── Emerging Symbols ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>Emerging Symbols</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {symbols.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle('emergingSymbols', s.id)}
                style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12,
                  cursor: 'pointer', background: 'none', fontFamily: 'inherit',
                  border: `1px solid ${form.emergingSymbols.includes(s.id) ? 'var(--accent-indigo)' : 'var(--border)'}`,
                  color: form.emergingSymbols.includes(s.id) ? '#7a7acf' : 'var(--cream-muted)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Visual Direction ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>Visual Direction</label>
          <textarea
            rows={4}
            value={form.visualDirection}
            onChange={e => set('visualDirection', e.target.value)}
            placeholder="Composition ideas, color instincts, image references, what you want to draw…"
          />
        </div>

        {/* ── Psychological Themes ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>Psychological Themes</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {themes.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle('psychologicalThemes', t.id)}
                style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12,
                  cursor: 'pointer', background: 'none', fontFamily: 'inherit',
                  border: `1px solid ${form.psychologicalThemes.includes(t.id) ? 'var(--gold-dim)' : 'var(--border)'}`,
                  color: form.psychologicalThemes.includes(t.id) ? 'var(--gold)' : 'var(--cream-muted)',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Guidebook Notes ── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <label style={{ marginTop: 0 }}>Guidebook Notes</label>
          <textarea
            rows={4}
            value={form.guidebookNotes}
            onChange={e => set('guidebookNotes', e.target.value)}
            placeholder="Draft language for the published guidebook — what would you tell a reader?"
          />
        </div>

        {/* ── Card Artwork ── */}
        {form.cardId && (
          <div className="panel" style={{ marginBottom: 16 }}>
            <label style={{ marginTop: 0 }}>Card Artwork</label>
            <p style={{ fontSize: 12, color: 'var(--cream-muted)', margin: '2px 0 12px' }}>
              Images uploaded here are stored in the card library under {form.cardName || 'the selected card'}.
            </p>

            {/* Existing images */}
            {cardImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                {cardImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={`/images/${img.filename}`}
                      alt={img.caption || ''}
                      style={{ height: 140, width: 'auto', borderRadius: 6, display: 'block', border: '1px solid var(--border)' }}
                    />
                    {img.caption && (
                      <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 4, maxWidth: 120 }}>
                        {img.caption}
                        {img.iteration && <span style={{ color: 'var(--gold-dim)', marginLeft: 4 }}>#{img.iteration}</span>}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleImageDelete(img.id)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 4,
                        color: '#fff', fontSize: 11, cursor: 'pointer', padding: '2px 6px',
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload controls */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 4, display: 'block' }}>Caption</label>
                <input
                  type="text"
                  value={imgCaption}
                  onChange={e => setImgCaption(e.target.value)}
                  placeholder="optional note…"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div style={{ width: 100 }}>
                <label style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 4, display: 'block' }}>Iteration</label>
                <input
                  type="text"
                  value={imgIteration}
                  onChange={e => setImgIteration(e.target.value)}
                  placeholder="v1, draft…"
                  style={{ fontSize: 13 }}
                />
              </div>
              <label style={{ margin: 0 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <span
                  className="btn btn-sm"
                  style={{ cursor: 'pointer', opacity: imgUploading ? 0.5 : 1, display: 'inline-block' }}
                >
                  {imgUploading ? 'Uploading…' : '↑ Add Artwork'}
                </span>
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <button className="btn btn-primary" onClick={handleSave}>✓ Save Entry</button>
          <Link to="/journal" className="btn">Cancel</Link>
          {id && (
            <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  )
}
