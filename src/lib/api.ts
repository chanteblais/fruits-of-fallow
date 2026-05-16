import type { JournalEntry, CardData, Symbol, Theme, CardImage, WeavingThread, EntryAnalysis } from '../types'
import { getAuthToken } from './authToken'

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getAuthToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: await authHeaders(body ? { 'Content-Type': 'application/json' } : undefined),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`)
  return res.json()
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export const api = {
  entries: {
    list: () => req<JournalEntry[]>('GET', '/api/entries'),
    get: (id: string) => req<JournalEntry>('GET', `/api/entries/${id}`),
    create: (e: Omit<JournalEntry, 'id'> & { id: string }) => req('POST', '/api/entries', e),
    update: (id: string, e: Partial<JournalEntry>) => req('PUT', `/api/entries/${id}`, e),
    delete: (id: string) => req('DELETE', `/api/entries/${id}`),
  },

  cards: {
    list: () => req<CardData[]>('GET', '/api/cards'),
    get: (id: string) => req<CardData>('GET', `/api/cards/${id}`),
    update: (id: string, data: Partial<CardData>) => req('PUT', `/api/cards/${id}`, data),
  },

  symbols: {
    list: () => req<Symbol[]>('GET', '/api/symbols'),
    get: (id: string) => req<Symbol>('GET', `/api/symbols/${id}`),
    update: (id: string, data: Partial<Symbol>) => req('PUT', `/api/symbols/${id}`, data),
  },

  themes: {
    list: () => req<Theme[]>('GET', '/api/themes'),
    get: (id: string) => req<Theme>('GET', `/api/themes/${id}`),
    update: (id: string, data: Partial<Theme>) => req('PUT', `/api/themes/${id}`, data),
  },

  images: {
    list: (refId: string) => req<CardImage[]>('GET', `/api/images/${refId}`),
    upload: (refId: string, refType: string, file: File, caption?: string, iteration?: string) => {
      const body = new FormData()
      body.append('file', file)
      body.append('refId', refId)
      body.append('refType', refType)
      if (caption) body.append('caption', caption)
      if (iteration) body.append('iteration', iteration)
      return authHeaders().then(headers =>
        fetch('/api/images', { method: 'POST', headers, body }).then(r => {
          if (!r.ok) throw new Error('Upload failed')
          return r.json() as Promise<{ id: string; url: string }>
        })
      )
    },
    updateCaption: (id: string, caption: string) => req('PATCH', `/api/images/${id}/caption`, { caption }),
    delete: (id: string) => req('DELETE', `/api/images/${id}`),
  },

  analyze: {
    getForEntry: (entryId: string) => req<EntryAnalysis>('GET', `/api/analyze/entry/${entryId}`),
    getForCard: (cardId: string) => req<EntryAnalysis[]>('GET', `/api/analyze/card/${cardId}`),
    run: (entryId: string) => req<EntryAnalysis>('POST', `/api/analyze/entry/${entryId}`),
  },

  weaving: {
    list: () => req<WeavingThread[]>('GET', '/api/living-thread'),
    get: (id: string) => req<WeavingThread>('GET', `/api/living-thread/${id}`),
    synthesize: (focus?: string, maxEntries?: number) =>
      req<WeavingThread>('POST', '/api/living-thread/synthesize', { focus, maxEntries }),
    delete: (id: string) => req('DELETE', `/api/living-thread/${id}`),
  },

  export: {
    download: () => req<unknown>('GET', '/api/export'),
    import: (data: unknown) => req('POST', '/api/export/import', data),
  },
}
