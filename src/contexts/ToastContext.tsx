import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface ToastContextValue {
  toast: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const toast = useCallback((message: string) => {
    setMsg(message)
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 2200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={`toast${visible ? ' visible' : ''}`}>{msg}</div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
