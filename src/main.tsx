import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from './App'
import './styles/globals.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — add it to .env')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/sign-in">
      <App />
    </ClerkProvider>
  </React.StrictMode>
)
