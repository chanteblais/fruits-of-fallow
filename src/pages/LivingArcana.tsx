export default function LivingArcana() {
  return (
    <>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/living_arcana.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
          Living Arcana
        </h2>
        <p>The evolving symbolic guidebook — what does each card mean?</p>
      </div>
      <div className="stub-notice">
        <div style={{ fontSize: 28, marginBottom: 16, color: 'var(--gold-dim)', letterSpacing: 8 }}>✧ · · · ✧</div>
        <p style={{ maxWidth: 520, textAlign: 'center', lineHeight: 1.8 }}>
          Living Arcana is the archive and atlas of the deck — card meanings, symbolism,
          archetypes, visual evolution, and guidebook drafts. One page per card,
          built up slowly through practice.
        </p>
        <p style={{ maxWidth: 520, textAlign: 'center', lineHeight: 1.8, marginTop: 12 }}>
          Coming in the next pass.
        </p>
      </div>
    </>
  )
}
