import { Router } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const FIELDS = [
  { label: 'Date',                        key: 'date' },
  { label: 'Card',                        key: 'cardName' },
  { label: 'Orientation',                 key: 'orientation' },
  { label: 'Primary Themes',              key: 'primaryThemes' },
  { label: 'Traditional Meaning',         key: 'traditionalMeaning' },
  { label: 'Personal Reflection',         key: 'personalReflection' },
  { label: 'How the Card Appeared Today', key: 'howAppeared' },
  { label: 'Quotes & Insights',           key: 'quotesInsights' },
  { label: 'Emerging Symbols',            key: 'emergingSymbols' },
  { label: 'Visual Direction',            key: 'visualDirection' },
  { label: 'Psychological Themes',        key: 'psychologicalThemes' },
  { label: 'Guidebook Notes',             key: 'guidebookNotes' },
]

function escape(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&')
}

function parseFields(raw: string): Record<string, string> {
  const text = raw.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  const result: Record<string, string> = {}

  for (let i = 0; i < FIELDS.length; i++) {
    const { label, key } = FIELDS[i]
    const nextLabel = FIELDS[i + 1]?.label

    const pattern = nextLabel
      ? new RegExp(`${escape(label)}\\s*:?\\s*([\\s\\S]*?)(?=\\n?${escape(nextLabel)}\\s*:?)`, 'i')
      : new RegExp(`${escape(label)}\\s*:?\\s*([\\s\\S]*)$`, 'i')

    const match = text.match(pattern)
    if (match) {
      // Strip inline hints like "(comma-separated…)"
      const value = match[1].replace(/^\s*\(.*?\)\s*/m, '').trim()
      if (value) result[key] = value
    }
  }

  return result
}

router.post('/', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    const text = req.file.buffer.toString('utf-8')
    const parsed = parseFields(text)
    res.json(parsed)
  } catch (err) {
    console.error('Parse error:', err)
    res.status(500).json({ error: 'Failed to read file' })
  }
})

export default router
