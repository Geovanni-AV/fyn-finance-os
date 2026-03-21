import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { useToast } from '../../context/ToastContext'

// ─── BUTTON ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type BtnSize    = 'sm' | 'md' | 'lg'

const BTN_VAR: Record<BtnVariant, string> = {
  primary:   'bg-primary hover:bg-primary-hover text-white shadow-sm',
  secondary: 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-border dark:hover:bg-dark-border',
  ghost:     'text-primary hover:bg-primary/10',
  danger:    'bg-danger hover:bg-red-600 text-white',
}
const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize; children: ReactNode
}
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-btn font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${BTN_VAR[variant]} ${BTN_SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true, clickable = false }:
  { children: ReactNode; className?: string; padding?: boolean; clickable?: boolean }) {
  return (
    <div className={`bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-card shadow-card dark:shadow-card-dark ${padding ? 'p-5' : ''} ${clickable ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
const BADGE: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-primary/10 text-primary',
  neutral: 'bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2',
}
export function Badge({ variant = 'neutral', children, className = '' }:
  { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-badge text-xs font-medium ${BADGE[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-light-surface dark:bg-dark-surface animate-pulse rounded ${className}`} />
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }:
  { icon: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <span className="material-symbols-outlined text-5xl text-light-muted dark:text-dark-muted mb-4">{icon}</span>
      <h3 className="text-base font-semibold text-light-text dark:text-dark-text mb-1">{title}</h3>
      <p className="text-sm text-light-text-2 dark:text-dark-text-2 mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  )
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }:
  { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-light-card dark:bg-dark-card rounded-card shadow-2xl p-6 w-full ${widths[size]} animate-scale-in border border-light-border dark:border-dark-border`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-btn hover:bg-light-surface dark:hover:bg-dark-surface text-light-muted dark:text-dark-muted cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── DRAWER ───────────────────────────────────────────────────────────────────
export function Drawer({ isOpen, onClose, title, children, width = 380 }:
  { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full z-50 bg-light-card dark:bg-dark-card border-l border-light-border dark:border-dark-border shadow-2xl flex flex-col transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border flex-shrink-0">
          <h3 className="text-base font-semibold text-light-text dark:text-dark-text">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-btn hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-xl text-light-muted dark:text-dark-muted">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">{children}</div>
      </div>
    </>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }:
  { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-light-text dark:text-dark-text">{label}</label>}
      <input
        className={`w-full bg-light-surface dark:bg-dark-surface border rounded-btn px-3 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors duration-150 ${error ? 'border-danger' : 'border-light-border dark:border-dark-border'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{error}</p>}
    </div>
  )
}

// ─── TOAST CONTAINER ──────────────────────────────────────────────────────────
const TOAST_ICON: Record<string, string> = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' }
const TOAST_COLOR: Record<string, string> = { success: 'text-success', error: 'text-danger', warning: 'text-warning', info: 'text-primary' }

export function ToastContainer() {
  const { toasts, remove } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)}
          className="flex items-center gap-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-card shadow-xl px-4 py-3 cursor-pointer animate-fade-in-up min-w-[280px] max-w-sm">
          <span className={`material-symbols-outlined text-xl flex-shrink-0 ${TOAST_COLOR[t.type]}`}>{TOAST_ICON[t.type]}</span>
          <p className="text-sm text-light-text dark:text-dark-text flex-1">{t.message}</p>
        </div>
      ))}
    </div>
  )
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }:
  { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-light-muted dark:bg-dark-surface'}`}
        onClick={() => onChange(!checked)}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
      {label && <span className="text-sm text-light-text dark:text-dark-text">{label}</span>}
    </label>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#2563EB', ghost }:
  { value: number; max?: number; color?: string; ghost?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const ghostPct = ghost ? Math.min((ghost / max) * 100, 100) : 0

  return (
    <div className="relative h-2 w-full bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
      {ghostPct > pct && (
        <div className="absolute inset-y-0 left-0 rounded-full opacity-30 transition-all duration-500"
          style={{ width: `${ghostPct}%`, backgroundColor: color }} />
      )}
      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── GAUGE CIRCULAR ───────────────────────────────────────────────────────────
export function GoalGauge({ percentage, color, size = 88 }:
  { percentage: number; color: string; size?: number }) {
  const deg = Math.min(percentage, 100) * 3.6
  return (
    <div className="relative flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${deg}deg, var(--gauge-track) ${deg}deg)` }}>
      <div className="absolute bg-light-card dark:bg-dark-card rounded-full flex items-center justify-center"
        style={{ width: size * 0.72, height: size * 0.72 }}>
        <span className="text-sm font-bold text-light-text dark:text-dark-text tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Eliminar' }:
  { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-light-text-2 dark:text-dark-text-2 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
