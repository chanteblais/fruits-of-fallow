export default function CardLibrary() {
  return (
    <>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/card_archive.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
          Card Archive
        </h2>
        <p>All 78 cards — personal notes, symbolism, visual design, guidebook drafts</p>
      </div>
      <div className="stub-notice">
        <img src="/images/card_archive.png" alt="" style={{ height: 200, width: 'auto', opacity: 0.7, marginBottom: 16 }} />
        <p>Card Archive coming in the next pass — 78 cards with 5 tabs each: Overview, Interpretations, Symbolism & Archetypes, Visual Design, and Guidebook Drafts.</p>
      </div>
    </>
  )
}
