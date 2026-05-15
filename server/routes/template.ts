import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  const template = `THE INNER ATLAS — Daily Pull Journal
======================================

DATE:
CARD:
ORIENTATION: upright / reversed

PRIMARY THEMES:


TRADITIONAL MEANING:


PERSONAL REFLECTION:


HOW THE CARD APPEARED TODAY:


QUOTES & INSIGHTS:


EMERGING SYMBOLS:
(comma-separated, e.g. moon, lantern, water)

VISUAL DIRECTION:


PSYCHOLOGICAL THEMES:
(comma-separated, e.g. Shadow Work, Thresholds)

GUIDEBOOK NOTES:


`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="daily-pull-journal.txt"')
  res.send(template)
})

export default router
