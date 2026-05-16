import { useEffect } from 'react'
import { useAuth } from '@clerk/react'
import { setTokenGetter } from '../lib/authToken'

// Runs inside ClerkProvider; wires Clerk's getToken into the plain api module.
export function TokenSync() {
  const { getToken } = useAuth()
  useEffect(() => {
    setTokenGetter(getToken)
  }, [getToken])
  return null
}
