import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { getAuth } from '@clerk/express'
import { supabase } from '../lib/supabase'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function parseImage(row: Record<string, unknown>) {
  return {
    id: row.id,
    filename: row.storage_path,
    url: row.url,
    refType: row.ref_type,
    refId: row.ref_id,
    caption: row.caption ?? '',
    iteration: row.iteration ?? '',
    date: row.date,
  }
}

router.get('/:refId', async (req, res) => {
  const { userId } = getAuth(req)
  const { data, error } = await supabase
    .from('images').select('*')
    .eq('ref_id', req.params.refId).eq('user_id', userId)
    .order('date', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json((data ?? []).map(parseImage))
})

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const { userId } = getAuth(req)
  const { refType, refId, caption = '', iteration = '' } = req.body
  const id = uid()
  const ext = path.extname(req.file.originalname) || ''
  const storagePath = `${userId}/${id}${ext}`

  const { error: uploadError } = await supabase.storage
    .from('tarot-images')
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype })
  if (uploadError) return res.status(500).json({ error: uploadError.message })

  const { data: { publicUrl } } = supabase.storage.from('tarot-images').getPublicUrl(storagePath)

  const { error: dbError } = await supabase.from('images').insert({
    id,
    user_id: userId,
    storage_path: storagePath,
    url: publicUrl,
    ref_type: refType,
    ref_id: refId,
    caption,
    iteration,
    date: new Date().toISOString(),
  })
  if (dbError) return res.status(500).json({ error: dbError.message })
  res.json({ id, url: publicUrl })
})

router.patch('/:id/caption', async (req, res) => {
  const { userId } = getAuth(req)
  const { error } = await supabase.from('images')
    .update({ caption: req.body.caption ?? '' })
    .eq('id', req.params.id).eq('user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  const { data } = await supabase.from('images').select('storage_path')
    .eq('id', req.params.id).eq('user_id', userId).maybeSingle()
  if (data?.storage_path) {
    await supabase.storage.from('tarot-images').remove([data.storage_path])
  }
  await supabase.from('images').delete().eq('id', req.params.id).eq('user_id', userId)
  res.json({ ok: true })
})

export default router
