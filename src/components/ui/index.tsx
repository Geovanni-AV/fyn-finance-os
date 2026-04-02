import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { useToast } from '../../context/ToastContext'

// ─── BUTTON ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type BtnSize    = 'sm' | 'md' | 'lg'

const BTN_VAR: Record<BtnVariant, string> = {
  primary:   'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 hover:shadow-primary/40',
  secondary: 'glass border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface hover:text-primary transition-all',
  ghost:     'text-primary hover:bg-primary/10',
  outline:   'border border-primary text-primary hover:bg-primary/5',
  danger:    'bg-danger hover:bg-red-600 text-white shadow-md shadow-danger/20',
}
const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize; children: ReactNode; iconOnly?: boolean
}
export function Button({ variant = 'primary', size = 'md', className = '', children, iconOnly, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-btn font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${BTN_VAR[variant]} ${BTN_SIZE[size]} ${iconOnly ? 'w-9 h-9 p-0' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true, clickable = false, onClick, style }:
  { children: ReactNode; className?: string; padding?: boolean; clickable?: boolean; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div onClick={onClick} style={style} className={`glass-card rounded-card shadow-card dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${padding ? 'p-5' : ''} ${clickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] border-opacity-50 hover:border-primary/30' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
const BADGE: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success border border-success/20',
  warning: 'bg-warning/15 text-warning border border-warning/20',
  danger:  'bg-danger/15 text-danger border border-danger/20',
  info:    'bg-primary/15 text-primary border border-primary/20',
  neutral: 'bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 border border-light-border dark:border-dark-border',
}
export function Badge({ variant = 'neutral', children, className = '' }:
  { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-badge text-xs font-semibold tracking-wide ${BADGE[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export interface SkeletonProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = "animate-pulse bg-light-border/20 dark:bg-dark-border/20"
  const variantClasses = {
    rectangular: "rounded-card",
    circular: "rounded-full",
    text: "rounded h-4 w-full"
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-light-surface dark:bg-dark-surface flex items-center justify-center mb-6 shadow-inner border border-light-border/20 dark:border-dark-border/20 group hover:scale-105 transition-transform duration-500">
        <span className="material-symbols-outlined text-4xl text-light-muted dark:text-dark-muted group-hover:text-primary transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-black text-light-text dark:text-dark-text mb-2 tracking-tight uppercase">
        {title}
      </h3>
      <p className="text-sm text-light-text-2 dark:text-dark-text-2 leading-relaxed mb-8 opacity-80 italic">
        {description}
      </p>
      {action && (
        <div className="w-full flex justify-center scale-110">
          {action}
        </div>
      )}
    </div>
  )
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }:
  { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handler)
    }
    return () => {
      document.removeEventListener('keydown', handler)
    }
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

// ─── TABS ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, activeTab, onChange, variant = 'underline' }:
  { tabs: { id: string; label: string; icon?: string }[]; activeTab: string; onChange: (id: string) => void; variant?: 'underline' | 'pills' }) {
  
  if (variant === 'pills') {
    return (
      <div className="flex bg-light-surface dark:bg-dark-surface rounded-card p-1 gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-btn transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-light-card dark:bg-dark-card text-primary shadow-sm'
                : 'text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            {tab.icon && <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex border-b border-light-border dark:border-dark-border overflow-x-auto no-scrollbar gap-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-1 py-3 text-sm transition-colors whitespace-nowrap border-b-2 ${
            activeTab === tab.id
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text'
          }`}
        >
          {tab.icon && <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── ACCORDION ────────────────────────────────────────────────────────────────
export function Accordion({ title, icon, defaultOpen = false, children, badge }:
  { title: string; icon?: string; defaultOpen?: boolean; children: ReactNode; badge?: string }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border border-light-border dark:border-dark-border rounded-card overflow-hidden bg-light-card dark:bg-dark-card transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-light-surface dark:hover:bg-dark-surface transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="material-symbols-outlined text-primary">{icon}</span>}
          <span className="font-semibold text-light-text dark:text-dark-text">{title}</span>
          {badge && <Badge variant="neutral">{badge}</Badge>}
        </div>
        <span className={`material-symbols-outlined text-light-muted dark:text-dark-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 border-t border-light-border dark:border-dark-border mt-1">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── CALENDAR GRID ────────────────────────────────────────────────────────────
export type CalendarEvent = { 
  id?: string;
  day: number; 
  color: string; 
  title: string; 
  type?: 'pago' | 'corte' | 'ingreso' | 'danger' | 'warning' | 'success' | 'info';
  amount?: number;
  icon?: string;
  label?: string; // Legacy field
}

export function CalendarGrid({ year, month, events, onDayClick, className = '' }:
  { year: number; month: number; events: CalendarEvent[]; onDayClick?: (day: number) => void; className?: string }) {
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1 // Monday start
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const getDayEvents = (d: number) => events.filter(e => e.day === d)

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
          <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-light-muted dark:text-dark-muted py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(b => <div key={`blank-${b}`} className="min-h-[50px] rounded-2xl opacity-10 bg-light-surface dark:bg-dark-surface" />)}
        {days.map(d => {
          const isToday = isCurrentMonth && today.getDate() === d
          const dayEvents = getDayEvents(d)
          // Consider 'pago' or 'danger' as urgent/payments
          const urgent = dayEvents.some(e => (e.type === 'pago' || e.type === 'danger') && d >= today.getDate() && d <= today.getDate() + 3 && isCurrentMonth)

          return (
            <div
              key={d}
              onClick={() => onDayClick?.(d)}
              title={dayEvents.map(e => e.title || e.label).join('\n')}
              className={`relative min-h-[50px] flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-300 p-1
                ${isToday 
                  ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30 z-10 scale-105' 
                  : 'bg-light-surface/40 dark:bg-dark-surface/40 text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface hover:shadow-md hover:-translate-y-0.5'}
                ${urgent && !isToday ? 'ring-2 ring-danger ring-inset' : ''}
              `}
            >
              <span className="text-sm z-10">{d}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1 z-10">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <div key={i} className="w-1 h-1 rounded-full shadow-sm" style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.8)' : e.color }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CHIP SELECTOR ────────────────────────────────────────────────────────────
export function ChipSelector({ options, value, onChange, multi = false }:
  { options: { value: string; label: string; icon?: string }[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean }) {
  
  const isSelected = (val: string) => multi ? (value as string[]).includes(val) : value === val

  const handleToggle = (val: string) => {
    if (multi) {
      const arr = value as string[]
      onChange(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
    } else {
      onChange(val)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = isSelected(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
              active 
                ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' 
                : 'bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 border-transparent hover:text-light-text dark:hover:text-dark-text hover:bg-light-border dark:hover:bg-dark-border'
            }`}
          >
            {opt.icon && <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
// ─── CHECKBOX ─────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, label, className = '' }:
  { checked: boolean; onChange: (v: boolean) => void; label?: string; className?: string }) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div 
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
          checked 
            ? 'bg-primary border-primary shadow-sm shadow-primary/20' 
            : 'bg-light-surface/50 dark:bg-dark-surface/50 border-light-border dark:border-dark-border group-hover:border-primary/50'
        }`}
      >
        {checked && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
      </div>
      {label && <span className="text-sm font-medium text-light-text dark:text-dark-text group-hover:text-primary transition-colors">{label}</span>}
    </label>
  )
}
