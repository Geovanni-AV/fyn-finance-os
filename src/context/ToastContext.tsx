import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toasts: ToastItem[]
  success: (msg: string) => void
  error:   (msg: string) => void
  warning: (msg: string) => void
  info:    (msg: string) => void
  remove:  (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}`
    setToasts(prev => [...prev.slice(-2), { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{
      toasts,
      success: (m) => add('success', m),
      error:   (m) => add('error',   m),
      warning: (m) => add('warning', m),
      info:    (m) => add('info',    m),
      remove,
    }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
