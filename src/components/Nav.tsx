import { NavLink, useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { api } from '../lib/api'

interface NavItem {
  to: string
  icon: string | null
  imgIcon?: string
  imgIconHeight?: number
  imgIconOffsetX?: number
  label: string
  end?: boolean
}

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Observe',
    items: [
      { to: '/', icon: null, imgIcon: '/images/daily_pull.png', label: 'Daily Pull', end: true },
      { to: '/journal', icon: null, imgIcon: '/images/journal.png', label: 'Journal' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/cards', icon: null, imgIcon: '/images/atelier.png', label: 'Atelier' },
      { to: '/symbols', icon: null, imgIcon: '/images/symbol.png', label: 'Symbol Lexicon' },
    ],
  },
  {
    label: 'Study',
    items: [
      { to: '/attunement', icon: null, imgIcon: '/images/attunement.png', imgIconHeight: 52, imgIconOffsetX: 6, label: 'Attunement' },
    ],
  },
  {
    label: 'Arcana',
    items: [
      { to: '/living-thread', icon: null, imgIcon: '/images/living_thread.png', label: 'Living Thread' },
      { to: '/living-arcana', icon: null, imgIcon: '/images/living_arcana.png', label: 'Living Arcana' },
    ],
  },
]

export default function Nav() {
  const { toast } = useToast()
  const navigate = useNavigate()

  async function handleExport() {
    try {
      const data = await api.export.download()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tarot-observatory-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast('Export saved ✓')
    } catch {
      toast('Export failed')
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        await api.export.import(data)
        toast('Import complete — refreshing…')
        setTimeout(() => navigate(0), 800)
      } catch {
        toast('Import failed — invalid file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <nav className="app-nav">
      <div className="nav-logo">
        <h1>☽ The Inner Atlas</h1>
        <p>Tarot Observatory</p>
      </div>

      {sections.map(sec => (
        <div key={sec.label}>
          <div className="nav-section-label">{sec.label}</div>
          {sec.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={item.imgIcon ? { padding: '0 20px 0 8px', lineHeight: 0, height: 48, overflow: 'hidden' } : undefined}
            >
              <span className="icon" style={item.imgIcon ? { width: 'auto', minWidth: 0, lineHeight: 0 } : undefined}>
                {item.imgIcon
                  ? <img src={item.imgIcon} alt="" style={{ height: item.imgIconHeight ?? 64, width: 'auto', verticalAlign: 'middle', opacity: 0.85, transform: item.imgIconOffsetX ? `translateX(${item.imgIconOffsetX}px)` : undefined }} />
                  : item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="nav-footer">
        <button className="btn btn-sm btn-ghost" onClick={handleExport}>↓ Export</button>
        <label style={{ margin: 0 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => document.getElementById('import-file')?.click()}>↑ Import</button>
        </label>
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
    </nav>
  )
}
