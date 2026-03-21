import type { Account, Transaction, Budget, SavingGoal, Debt, Alert, NetWorthSnapshot, UserProfile, AlertSettings } from '../types'

export const mockProfile: UserProfile = {
  name: 'Alejandro Silva',
  email: 'alejandro.silva@gmail.com',
  currency: 'MXN',
  theme: 'dark',
}

export const mockAlertSettings: AlertSettings = {
  presupuestoAlerta: true, presupuestoExcedido: true,
  pagoProximo: true, pagoVencido: true, metaLograda: true,
  saldoBajo: true, gastoInusual: false, rachaAhorro: true,
  resumenSemanal: false,
}

export const mockAccounts: Account[] = [
  { id: 'acc-1', name: 'BBVA Nómina',     bank: 'BBVA',     type: 'debito',   balance: 24500,   currency: 'MXN', color: '#004A9F', lastFour: '4521', isActive: true },
  { id: 'acc-2', name: 'Nu Crédito',      bank: 'Nu',       type: 'credito',  balance: -8200,   creditLimit: 30000, currency: 'MXN', color: '#820AD1', lastFour: '8834', isActive: true },
  { id: 'acc-3', name: 'Klar Débito',     bank: 'Klar',     type: 'debito',   balance: 6800,    currency: 'MXN', color: '#00C4B3', lastFour: '2210', isActive: true },
  { id: 'acc-4', name: 'Openbank Ahorro', bank: 'Openbank', type: 'inversion',balance: 45000,   currency: 'MXN', color: '#E3000F', lastFour: '9901', isActive: true },
  { id: 'acc-5', name: 'Efectivo',        bank: 'Otra',     type: 'efectivo', balance: 1200,    currency: 'MXN', color: '#10B981', isActive: true },
]

export const mockTransactions: Transaction[] = [
  { id: 'tx-001', date: '2026-03-20', amount: 18500, type: 'ingreso',       category: 'nomina',          description: 'Quincena marzo 2da',       accountId: 'acc-1', source: 'sync' },
  { id: 'tx-002', date: '2026-03-19', amount: 580,   type: 'gasto',         category: 'alimentacion',    description: 'Despensa Walmart',          accountId: 'acc-1', source: 'manual' },
  { id: 'tx-003', date: '2026-03-18', amount: 320,   type: 'gasto',         category: 'transporte',      description: 'Uber × 3',                  accountId: 'acc-1', source: 'manual' },
  { id: 'tx-004', date: '2026-03-17', amount: 299,   type: 'gasto',         category: 'entretenimiento', description: 'Netflix Premium',            accountId: 'acc-2', source: 'sync', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-005', date: '2026-03-16', amount: 2800,  type: 'gasto',         category: 'ropa',            description: 'Zara — temporada',          accountId: 'acc-2', source: 'manual' },
  { id: 'tx-006', date: '2026-03-15', amount: 18500, type: 'ingreso',       category: 'nomina',          description: 'Quincena marzo 1ra',        accountId: 'acc-1', source: 'sync' },
  { id: 'tx-007', date: '2026-03-14', amount: 450,   type: 'gasto',         category: 'servicios',       description: 'CFE — luz',                 accountId: 'acc-1', source: 'pdf', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-008', date: '2026-03-13', amount: 125,   type: 'gasto',         category: 'alimentacion',    description: 'Starbucks',                 accountId: 'acc-2', source: 'manual' },
  { id: 'tx-009', date: '2026-03-12', amount: 1200,  type: 'gasto',         category: 'salud',           description: 'Consulta médica + medicinas', accountId: 'acc-1', source: 'manual' },
  { id: 'tx-010', date: '2026-03-11', amount: 850,   type: 'gasto',         category: 'entretenimiento', description: 'Cena restaurante',          accountId: 'acc-2', source: 'manual' },
  { id: 'tx-011', date: '2026-03-10', amount: 15000, type: 'gasto',         category: 'hogar',           description: 'Renta departamento',        accountId: 'acc-1', source: 'manual', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-012', date: '2026-03-09', amount: 3500,  type: 'freelance',     category: 'freelance',       description: 'Proyecto diseño web',       accountId: 'acc-3', source: 'manual' },
  { id: 'tx-013', date: '2026-03-08', amount: 240,   type: 'gasto',         category: 'alimentacion',    description: 'McDonald\'s × familia',     accountId: 'acc-2', source: 'manual' },
  { id: 'tx-014', date: '2026-03-07', amount: 650,   type: 'gasto',         category: 'entretenimiento', description: 'Smart Fit — mensualidad',   accountId: 'acc-1', source: 'sync', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-015', date: '2026-03-06', amount: 480,   type: 'gasto',         category: 'transporte',      description: 'Gasolina Pemex',            accountId: 'acc-1', source: 'manual' },
  { id: 'tx-016', date: '2026-03-05', amount: 189,   type: 'gasto',         category: 'entretenimiento', description: 'Spotify + Disney+',         accountId: 'acc-2', source: 'sync', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-017', date: '2026-03-04', amount: 2450,  type: 'gasto',         category: 'servicios',       description: 'GNP Seguros Auto',          accountId: 'acc-1', source: 'manual', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-018', date: '2026-03-03', amount: 380,   type: 'gasto',         category: 'alimentacion',    description: 'La Costilla — familia',     accountId: 'acc-2', source: 'manual' },
  { id: 'tx-019', date: '2026-03-02', amount: 1100,  type: 'gasto',         category: 'hogar',           description: 'Telmex — internet + tel.',  accountId: 'acc-1', source: 'pdf', isRecurring: true, recurrencePeriod: 'mensual' },
  { id: 'tx-020', date: '2026-03-01', amount: 560,   type: 'gasto',         category: 'educacion',       description: 'Udemy — cursos',            accountId: 'acc-3', source: 'manual' },
  // Febrero
  { id: 'tx-021', date: '2026-02-28', amount: 18500, type: 'ingreso',       category: 'nomina',          description: 'Quincena feb 2da',          accountId: 'acc-1', source: 'sync' },
  { id: 'tx-022', date: '2026-02-25', amount: 620,   type: 'gasto',         category: 'alimentacion',    description: 'Soriana — despensa',        accountId: 'acc-1', source: 'manual' },
  { id: 'tx-023', date: '2026-02-22', amount: 3200,  type: 'gasto',         category: 'ropa',            description: 'Liverpool — ropa',          accountId: 'acc-2', source: 'manual' },
  { id: 'tx-024', date: '2026-02-15', amount: 18500, type: 'ingreso',       category: 'nomina',          description: 'Quincena feb 1ra',          accountId: 'acc-1', source: 'sync' },
  { id: 'tx-025', date: '2026-02-14', amount: 1800,  type: 'gasto',         category: 'entretenimiento', description: 'Cena San Valentín',         accountId: 'acc-2', source: 'manual' },
  { id: 'tx-026', date: '2026-02-10', amount: 15000, type: 'gasto',         category: 'hogar',           description: 'Renta departamento',        accountId: 'acc-1', source: 'manual' },
  { id: 'tx-027', date: '2026-02-08', amount: 2800,  type: 'freelance',     category: 'freelance',       description: 'Proyecto branding',         accountId: 'acc-3', source: 'manual' },
  { id: 'tx-028', date: '2026-02-05', amount: 390,   type: 'gasto',         category: 'transporte',      description: 'Uber × viajes',             accountId: 'acc-1', source: 'manual' },
  { id: 'tx-029', date: '2026-02-03', amount: 450,   type: 'gasto',         category: 'servicios',       description: 'CFE — luz',                 accountId: 'acc-1', source: 'pdf' },
  { id: 'tx-030', date: '2026-02-01', amount: 9800,  type: 'inversiones',   category: 'inversiones',     description: 'CETES directo',             accountId: 'acc-4', source: 'manual' },
  // Enero
  { id: 'tx-031', date: '2026-01-31', amount: 18500, type: 'ingreso',       category: 'nomina',          description: 'Quincena ene 2da',          accountId: 'acc-1', source: 'sync' },
  { id: 'tx-032', date: '2026-01-20', amount: 5200,  type: 'gasto',         category: 'ropa',            description: 'Rebajas enero',             accountId: 'acc-2', source: 'manual' },
  { id: 'tx-033', date: '2026-01-15', amount: 18500, type: 'ingreso',       category: 'nomina',          description: 'Quincena ene 1ra',          accountId: 'acc-1', source: 'sync' },
  { id: 'tx-034', date: '2026-01-10', amount: 15000, type: 'gasto',         category: 'hogar',           description: 'Renta departamento',        accountId: 'acc-1', source: 'manual' },
  { id: 'tx-035', date: '2026-01-05', amount: 4500,  type: 'freelance',     category: 'freelance',       description: 'Proyecto enero',            accountId: 'acc-3', source: 'manual' },
]

export const mockBudgets: Budget[] = [
  { id: 'bud-1', category: 'alimentacion',    monthlyLimit: 4500,  spent: 1825, period: '2026-03' },
  { id: 'bud-2', category: 'transporte',      monthlyLimit: 2000,  spent: 800,  period: '2026-03' },
  { id: 'bud-3', category: 'entretenimiento', monthlyLimit: 1500,  spent: 1538, period: '2026-03' },
  { id: 'bud-4', category: 'salud',           monthlyLimit: 1500,  spent: 1200, period: '2026-03' },
  { id: 'bud-5', category: 'ropa',            monthlyLimit: 2000,  spent: 2800, period: '2026-03' },
  { id: 'bud-6', category: 'hogar',           monthlyLimit: 17000, spent: 16100,period: '2026-03' },
  { id: 'bud-7', category: 'servicios',       monthlyLimit: 3500,  spent: 2900, period: '2026-03' },
  { id: 'bud-8', category: 'educacion',       monthlyLimit: 1000,  spent: 560,  period: '2026-03' },
]

export const mockGoals: SavingGoal[] = [
  { id: 'goal-1', name: 'Fondo de emergencia', type: 'emergencia', targetAmount: 60000, currentAmount: 45000, targetDate: '2026-12-31', monthlyContribution: 2500, expectedReturn: 0.07, color: '#10B981', icon: 'shield' },
  { id: 'goal-2', name: 'Vacaciones Japón',    type: 'viaje',       targetAmount: 35000, currentAmount: 12000, targetDate: '2026-09-01', monthlyContribution: 3500, expectedReturn: 0.05, color: '#2563EB', icon: 'flight' },
  { id: 'goal-3', name: 'MacBook Pro M4',      type: 'otro',        targetAmount: 55000, currentAmount: 44000, targetDate: '2026-07-15', monthlyContribution: 5000, expectedReturn: 0.04, color: '#6366F1', icon: 'laptop_mac' },
  { id: 'goal-4', name: 'Enganche depa',       type: 'casa',        targetAmount: 200000,currentAmount: 45000, targetDate: '2028-01-01', monthlyContribution: 6000, expectedReturn: 0.08, color: '#F59E0B', icon: 'home' },
  { id: 'goal-5', name: 'Retiro 2050',         type: 'retiro',      targetAmount: 3000000,currentAmount: 85000,targetDate: '2050-01-01', monthlyContribution: 3000, expectedReturn: 0.10, color: '#8B5CF6', icon: 'elderly' },
]

export const mockDebts: Debt[] = [
  { id: 'debt-1', name: 'Nu Crédito',         type: 'tarjeta',           balance: 8200,  originalBalance: 15000,  interestRate: 0.36, minimumPayment: 820,  dueDay: 15 },
  { id: 'debt-2', name: 'Crédito personal',   type: 'prestamo_personal', balance: 22000, originalBalance: 30000,  interestRate: 0.28, minimumPayment: 1200, dueDay: 10 },
  { id: 'debt-3', name: 'Auto Nissan',         type: 'auto',              balance: 85000, originalBalance: 120000, interestRate: 0.12, minimumPayment: 2800, dueDay: 5  },
  { id: 'debt-4', name: 'Meses sin intereses', type: 'tarjeta',           balance: 4500,  originalBalance: 4500,   interestRate: 0.00, minimumPayment: 750,  dueDay: 20 },
]

export const mockAlerts: Alert[] = [
  { id: 'alert-1', type: 'presupuesto_excedido', severity: 'danger',  title: 'Presupuesto excedido', message: 'Superaste el límite en Ropa: $2,800 de $2,000', date: '2026-03-19T10:00:00Z', isRead: false },
  { id: 'alert-2', type: 'pago_proximo',         severity: 'warning', title: 'Pago próximo',         message: 'Nu Crédito vence en 3 días — $820 mínimo', date: '2026-03-18T09:00:00Z', isRead: false },
  { id: 'alert-3', type: 'presupuesto_alerta',   severity: 'warning', title: 'Atención en presupuesto', message: 'Entretenimiento al 102% del límite mensual', date: '2026-03-17T15:00:00Z', isRead: false },
  { id: 'alert-4', type: 'racha_ahorro',         severity: 'success', title: '¡Racha de ahorro!',    message: 'Llevas 3 semanas consecutivas bajo presupuesto en transporte', date: '2026-03-16T08:00:00Z', isRead: false },
  { id: 'alert-5', type: 'pago_proximo',         severity: 'info',    title: 'Recordatorio de pago', message: 'Crédito personal vence el día 10 — $1,200 mínimo', date: '2026-03-15T12:00:00Z', isRead: true },
  { id: 'alert-6', type: 'meta_lograda',         severity: 'success', title: '¡Meta casi lista!',    message: 'MacBook Pro al 80% — faltan $11,000 para completarla', date: '2026-03-14T11:00:00Z', isRead: true },
]

export const mockNetWorthHistory: NetWorthSnapshot[] = [
  { month: '2025-03', assets: 58000,  liabilities: 48000, netWorth: 10000 },
  { month: '2025-04', assets: 61000,  liabilities: 46500, netWorth: 14500 },
  { month: '2025-05', assets: 64500,  liabilities: 45000, netWorth: 19500 },
  { month: '2025-06', assets: 67000,  liabilities: 43200, netWorth: 23800 },
  { month: '2025-07', assets: 71000,  liabilities: 41800, netWorth: 29200 },
  { month: '2025-08', assets: 74500,  liabilities: 40000, netWorth: 34500 },
  { month: '2025-09', assets: 78000,  liabilities: 38500, netWorth: 39500 },
  { month: '2025-10', assets: 82000,  liabilities: 37000, netWorth: 45000 },
  { month: '2025-11', assets: 85500,  liabilities: 35800, netWorth: 49700 },
  { month: '2025-12', assets: 90000,  liabilities: 124000,netWorth: -34000 },
  { month: '2026-01', assets: 94000,  liabilities: 121000,netWorth: -27000 },
  { month: '2026-02', assets: 98000,  liabilities: 119000,netWorth: -21000 },
]
