import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { CARDS_78, SUIT_COLOR } from '../../lib/cards'
import type { JournalEntry } from '../../types'

export default function LivingArcana() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.entries.list().then(e => { setEntries(e); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Count pulls per card
  const pullCount: Record<string, number> = {}
  for (const e of entries) {
    pullCount[e.cardId] = (pullCount[e.cardId] || 0) + 1
  }

  const suits = ['major', 'wands', 'cups', 'swords', 'pentacles'] as const
  const suitLabels: Record<string, string> = {
    major: 'Major Arcana', wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles',
  }

  return (
    <>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/living_arcana.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
          Living Arcana
        </h2>
        <p>The evolving symbolic guidebook — one page per card, built through practice.</p>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div style={{ paddingBottom: 48 }}>
          {suits.map(suit => {
            const cards = CARDS_78.filter(c => c.suit === suit)
            return (
              <div key={suit} style={{ marginBottom: 36 }}>
                <h3 style={{
                  fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase',
                  color: 'var(--gold)', marginBottom: 14,
                }}>
                  {suitLabels[suit]}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cards.map(card => {
                    const count = pullCount[card.id] || 0
                    return (
                      <Link
                        key={card.id}
                        to={`/living-arcana/${card.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: `1px solid ${count > 0 ? 'var(--gold-dim)' : 'var(--border)'}`,
                          background: count > 0 ? 'rgba(201,164,82,0.05)' : 'transparent',
                          cursor: 'pointer',
                          minWidth: 120,
                          position: 'relative',
                        }}>
                          <div style={{
                            fontSize: 12,
                            color: count > 0 ? 'var(--cream-dim)' : 'var(--cream-muted)',
                            marginBottom: count > 0 ? 4 : 0,
                          }}>
                            {card.name}
                          </div>
                          {count > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--gold-dim)' }}>
                              {count} {count === 1 ? 'pull' : 'pulls'}
                            </div>
                          )}
                          <div style={{
                            position: 'absolute', top: 6, right: 8,
                            width: 6, height: 6, borderRadius: '50%',
                            background: count > 0 ? SUIT_COLOR[suit] : 'transparent',
                            border: count > 0 ? 'none' : '1px solid var(--border)',
                          }} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
