import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { db, IMG_DIR } from '../db'

const router = Router()

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const storage = multer.diskStorage({
  destination: IMG_DIR,
  filename: (_req, file, cb) => {
    const id = uid()
    cb(null, `${id}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

router.get('/:refId', (req, res) => {
  const rows = db.prepare('SELECT * FROM images WHERE ref_id = ? ORDER BY date ASC').all(req.params.refId)
  res.json(rows)
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const { refType, refId, caption, iteration } = req.body
  const id = uid()
  db.prepare(`
    INSERT INTO images (id, filename, ref_type, ref_id, caption, iteration, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.file.filename, refType, refId, caption || '', iteration || '', new Date().toISOString())
  res.json({ id, filename: req.file.filename })
})

router.patch('/:id/caption', (req, res) => {
  db.prepare('UPDATE images SET caption = ? WHERE id = ?').run(req.body.caption || '', req.params.id)
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT filename FROM images WHERE id = ?').get(req.params.id) as { filename: string } | undefined
  if (row) {
    const filePath = path.join(IMG_DIR, row.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id)
  }
  res.json({ ok: true })
})

export default router
