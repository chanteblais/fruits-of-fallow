import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { CARD_MAP, SUIT_COLOR } from '../lib/cards'
import type { CardImage, JournalEntry } from '../types'

type CardImageGroup = {
  cardId: string
  pullCount: number
  images: CardImage[]
}

export default function CardLibrary() {
  const [groups, setGroups] = useState<CardImageGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api.entries.list()
      .then(async entries => {
        const groupedPulls = entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
          if (!entry.cardId) return acc
          acc[entry.cardId] = [...(acc[entry.cardId] || []), entry]
          return acc
        }, {})

        const imageGroups = await Promise.all(
          Object.entries(groupedPulls).map(async ([cardId, cardEntries]) => {
            const images = await api.images.list(cardId).catch(() => [] as CardImage[])
            return { cardId, pullCount: cardEntries.length, images }
          })
        )

        if (!cancelled) {
          setGroups(
            imageGroups
              .filter(group => group.images.length > 0)
              .sort((a, b) => {
                const cardA = CARD_MAP[a.cardId]
                const cardB = CARD_MAP[b.cardId]
                if (!cardA || !cardB) return a.cardId.localeCompare(b.cardId)
                if (cardA.suit !== cardB.suit) return cardA.suit.localeCompare(cardB.suit)
                return cardA.num - cardB.num
              })
          )
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/card_archive.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
          Atelier
        </h2>
        <p>Artwork from pulled cards, grouped by card type.</p>
      </div>

      {loading ? (
        <div className="loading">Loading atelier…</div>
      ) : groups.length === 0 ? (
        <div className="stub-notice">
          <img src="/images/card_archive.png" alt="" style={{ height: 200, width: 'auto', opacity: 0.7, marginBottom: 16 }} />
          <p>No pulled card artwork yet. Add artwork while logging a pull, and it will appear here grouped by card.</p>
          <Link to="/journal/new" className="btn btn-primary" style={{ marginTop: 16 }}>Pull Card</Link>
        </div>
      ) : (
        <div className="atelier-groups">
          {groups.map(group => {
            const card = CARD_MAP[group.cardId]
            const suit = card?.suit || 'major'

            return (
              <section key={group.cardId} className="panel atelier-group">
                <div className="atelier-group-header">
                  <div>
                    <h3>{card?.name || group.cardId}</h3>
                    <p>
                      <span className={`tag tag-suit-${suit}`}>{suit}</span>
                      <span>{group.pullCount} {group.pullCount === 1 ? 'pull' : 'pulls'} recorded</span>
                    </p>
                  </div>
                  <Link to={`/living-arcana/${group.cardId}`} className="btn btn-sm btn-ghost">Living Arcana</Link>
                </div>

                <div className="atelier-image-grid">
                  {[...group.images].reverse().map(image => (
                    <figure key={image.id} className="atelier-image-card">
                      <img src={`/images/${image.filename}`} alt={image.caption || card?.name || 'Card artwork'} />
                      {(image.caption || image.iteration) && (
                        <figcaption>
                          {image.caption}
                          {image.iteration && <span>#{image.iteration}</span>}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
