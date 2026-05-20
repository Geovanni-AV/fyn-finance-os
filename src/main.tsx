import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary.tsx'

// Capturar errores no controlados en el proceso de Renderizado (React UI)
window.onerror = (message, url, line, col, error) => {
  const electron = (window as any).electronAPI
  if (electron && electron.logRendererError) {
    electron.logRendererError({
      message: String(message),
      stack: error?.stack || `at ${url}:${line}:${col}`,
      url,
      line,
      col
    }).catch((err: any) => console.error('Failed to log renderer error:', err))
  }
}

window.onunhandledrejection = (event) => {
  const electron = (window as any).electronAPI
  if (electron && electron.logRendererError) {
    const reason = event.reason
    electron.logRendererError({
      message: reason?.message || String(reason),
      stack: reason?.stack || 'Unhandled promise rejection'
    }).catch((err: any) => console.error('Failed to log unhandled rejection:', err))
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

