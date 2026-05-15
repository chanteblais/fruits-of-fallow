export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function fmt(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function fmtShort(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function calcStreak(entries: { date: string }[]): number {
  if (!entries.length) return 0
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let cur = today()
  for (const e of sorted) {
    if (e.date === cur) {
      streak++
      const d = new Date(cur)
      d.setDate(d.getDate() - 1)
      cur = d.toISOString().split('T')[0]
    } else if (e.date < cur) {
      break
    }
  }
  return streak
}
