export default function Attunement() {
  return (
    <>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/images/attunement.png" alt="" width={40} height={40} style={{ objectFit: 'contain', opacity: 0.9 }} />
          Attunement
        </h2>
        <p>Daily prompt, numerology, elemental correspondences, astrology, card comparison</p>
      </div>
      <div className="stub-notice">
        <img src="/images/attunement.png" alt="" style={{ height: 200, width: 'auto', opacity: 0.7, marginBottom: 16 }} />
        <p>Attunement coming in the next pass — daily study prompt, numerology reference, elemental correspondences, astrological table, and a side-by-side card comparison tool.</p>
      </div>
    </>
  )
}
