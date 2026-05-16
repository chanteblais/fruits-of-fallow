// Bridges Clerk's React hook world with the plain api.ts module.
// TokenSync component (rendered inside ClerkProvider) calls setTokenGetter
// once on mount; api.ts calls getAuthToken() before every request.
let _getToken: (() => Promise<string | null>) | null = null

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

export async function getAuthToken(): Promise<string | null> {
  if (!_getToken) return null
  return _getToken()
}
