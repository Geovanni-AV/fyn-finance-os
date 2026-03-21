// ─── CUENTA ───────────────────────────────────────────────────────────────────
export type AccountType = 'debito' | 'credito' | 'efectivo' | 'inversion'
export type BankName = 'BBVA' | 'Klar' | 'Nu' | 'Openbank' | 'Santander' | 'HSBC' | 'Otra'

export interface Account {
  id: string
  name: string
  bank: BankName
  type: AccountType
  balance: number
  creditLimit?: number
  currency: 'MXN'
  color: string
  lastFour?: string
  isActive: boolean
}

// ─── TRANSACCIÓN ──────────────────────────────────────────────────────────────
export type TransactionType = 'gasto' | 'ingreso' | 'transferencia'
export type TransactionSource = 'manual' | 'ocr' | 'pdf' | 'sync'

export type CategoryId =
  | 'alimentacion' | 'transporte' | 'entretenimiento' | 'salud'
  | 'educacion' | 'ropa' | 'hogar' | 'servicios'
  | 'nomina' | 'freelance' | 'inversiones' | 'otros'

export interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  category: CategoryId
  description: string
  accountId: string
  source: TransactionSource
  isRecurring?: boolean
  recurrencePeriod?: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'anual'
  tags?: string[]
  notes?: string
}

// ─── PRESUPUESTO ──────────────────────────────────────────────────────────────
export interface Budget {
  id: string
  category: CategoryId
  monthlyLimit: number
  spent: number
  period: string
}

export type BudgetStatus = 'ok' | 'warning' | 'danger'

export const getBudgetStatus = (budget: Budget): BudgetStatus => {
  const pct = budget.monthlyLimit > 0 ? budget.spent / budget.monthlyLimit : 0
  if (pct < 0.70) return 'ok'
  if (pct < 0.90) return 'warning'
  return 'danger'
}

// ─── META DE AHORRO ───────────────────────────────────────────────────────────
export type GoalType = 'emergencia' | 'viaje' | 'auto' | 'casa' | 'educacion' | 'retiro' | 'otro'

export interface SavingGoal {
  id: string
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
  expectedReturn: number
  accountId?: string
  color: string
  icon: string
}

// ─── DEUDA ────────────────────────────────────────────────────────────────────
export type DebtType = 'tarjeta' | 'prestamo_personal' | 'hipoteca' | 'auto' | 'otro'

export interface Debt {
  id: string
  name: string
  type: DebtType
  balance: number
  originalBalance: number
  interestRate: number
  minimumPayment: number
  dueDay: number
  accountId?: string
}

// ─── ALERTA ───────────────────────────────────────────────────────────────────
export type AlertType =
  | 'presupuesto_alerta' | 'presupuesto_excedido'
  | 'pago_proximo' | 'pago_vencido'
  | 'meta_lograda' | 'saldo_bajo'
  | 'gasto_inusual' | 'racha_ahorro'

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  date: string
  isRead: boolean
  relatedEntityId?: string
}

// ─── NET WORTH ────────────────────────────────────────────────────────────────
export interface NetWorthSnapshot {
  month: string
  assets: number
  liabilities: number
  netWorth: number
}

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
export interface UserProfile {
  name: string
  email: string
  currency: 'MXN'
  theme: 'dark' | 'light'
}

export interface AlertSettings {
  presupuestoAlerta: boolean
  presupuestoExcedido: boolean
  pagoProximo: boolean
  pagoVencido: boolean
  metaLograda: boolean
  saldoBajo: boolean
  gastoInusual: boolean
  rachaAhorro: boolean
  resumenSemanal: boolean
}

// ─── APP STATE ────────────────────────────────────────────────────────────────
export interface AppState {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingGoal[]
  debts: Debt[]
  alerts: Alert[]
  netWorthHistory: NetWorthSnapshot[]
  profile: UserProfile
  alertSettings: AlertSettings
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const formatMXN = (amount: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

export const formatMXNShort = (amount: number): string => {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return formatMXN(amount)
}

export const formatPercent = (value: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 1 }).format(value)

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  alimentacion: 'Alimentación', transporte: 'Transporte',
  entretenimiento: 'Entretenimiento', salud: 'Salud',
  educacion: 'Educación', ropa: 'Ropa', hogar: 'Hogar',
  servicios: 'Servicios', nomina: 'Nómina', freelance: 'Freelance',
  inversiones: 'Inversiones', otros: 'Otros',
}

export const CATEGORY_ICONS: Record<CategoryId, string> = {
  alimentacion: 'restaurant', transporte: 'directions_car',
  entretenimiento: 'movie', salud: 'favorite',
  educacion: 'school', ropa: 'checkroom', hogar: 'home',
  servicios: 'bolt', nomina: 'payments', freelance: 'work',
  inversiones: 'trending_up', otros: 'category',
}

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  alimentacion: '#10B981', transporte: '#3B82F6', entretenimiento: '#8B5CF6',
  salud: '#EF4444', educacion: '#F59E0B', ropa: '#EC4899', hogar: '#06B6D4',
  servicios: '#F97316', nomina: '#10B981', freelance: '#6366F1',
  inversiones: '#14B8A6', otros: '#94A3B8',
}
