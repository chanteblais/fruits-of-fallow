import 'dotenv/config'
import express from 'express'
import { clerkMiddleware, requireAuth } from '@clerk/express'
import entriesRouter from './routes/entries'
import cardsRouter from './routes/cards'
import imagesRouter from './routes/images'
import symbolsRouter from './routes/symbols'
import themesRouter from './routes/themes'
import exportRouter from './routes/export'
import pdfRouter from './routes/pdf'
import templateRouter from './routes/template'
import weavingRouter from './routes/weaving'
import analyzeRouter from './routes/analyze'

const app = express()
const PORT = 3001

app.use(clerkMiddleware())
app.use(express.json({ limit: '50mb' }))
app.use('/api', requireAuth())

app.use('/api/entries', entriesRouter)
app.use('/api/cards', cardsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/symbols', symbolsRouter)
app.use('/api/themes', themesRouter)
app.use('/api/export', exportRouter)
app.use('/api/parse-pdf', pdfRouter)
app.use('/api/journal-template', templateRouter)
app.use('/api/living-thread', weavingRouter)
app.use('/api/analyze', analyzeRouter)

app.listen(PORT, () => {
  console.log(`\n  ☽ Tarot Observatory API → http://localhost:${PORT}\n`)
})
