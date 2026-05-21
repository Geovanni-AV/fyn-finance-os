import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import type { Transaction, Budget } from '../types'

export function useDashboardKPIs() {
  const { transactions, accounts, budgets, selectedPeriod } = useApp()

  return useMemo(() => {
    const currentMonth = selectedPeriod
    const monthTx = transactions.filter(t => t.date.startsWith(currentMonth))

    const ingresos = monthTx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const gastos   = monthTx.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
    const ahorro   = ingresos - gastos
    const tasaAhorro = ingresos > 0 ? ahorro / ingresos : 0
    const totalBalance = accounts.filter(a => a.isActive).reduce((s, a) => s + a.balance, 0)
    const presupuestoTotal = budgets.reduce((s, b) => s + b.monthlyLimit, 0)
    const porcentajeGastado = presupuestoTotal > 0 ? gastos / presupuestoTotal : 0

    const today = new Date()
    const currentRealMonth = today.toISOString().slice(0, 7)
    
    let daysInMonth: number
    let dayOfMonth: number
    
    if (selectedPeriod === currentRealMonth) {
      daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      dayOfMonth = today.getDate()
    } else {
      const [year, month] = selectedPeriod.split('-').map(Number)
      daysInMonth = new Date(year, month, 0).getDate()
      dayOfMonth = daysInMonth
    }
    
    const gastosProyectados = dayOfMonth > 0 ? (gastos / dayOfMonth) * daysInMonth : 0

    return { ingresos, gastos, ahorro, tasaAhorro, totalBalance, porcentajeGastado, gastosProyectados, presupuestoTotal }
  }, [transactions, accounts, budgets, selectedPeriod])
}

export function useBudgetStatus(budget: Budget) {
  const { selectedPeriod } = useApp()
  return useMemo(() => {
    const pct = budget.monthlyLimit > 0 ? budget.spent / budget.monthlyLimit : 0
    const today = new Date()
    const currentRealMonth = today.toISOString().slice(0, 7)
    
    let daysInMonth: number
    let dayOfMonth: number
    
    if (selectedPeriod === currentRealMonth) {
      daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      dayOfMonth = today.getDate()
    } else {
      const [year, month] = selectedPeriod.split('-').map(Number)
      daysInMonth = new Date(year, month, 0).getDate()
      dayOfMonth = daysInMonth
    }
    
    const projected = dayOfMonth > 0 ? (budget.spent / dayOfMonth) * daysInMonth : budget.spent
    const projectedPct = budget.monthlyLimit > 0 ? projected / budget.monthlyLimit : 0

    const status = pct < 0.70 ? 'ok' : pct < 0.90 ? 'warning' : 'danger'
    return { pct, projected, projectedPct, status }
  }, [budget, selectedPeriod])
}

export function useNetWorth() {
  const { accounts } = useApp()
  return useMemo(() => {
    const assets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
    const liabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)
    return { assets, liabilities, netWorth: assets - liabilities }
  }, [accounts])
}

export function useRecentTransactions(limit = 5) {
  const { transactions } = useApp()
  return useMemo(() =>
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit),
    [transactions, limit]
  )
}

export function useMonthTransactions() {
  const { transactions, selectedPeriod } = useApp()
  return useMemo(() =>
    transactions.filter(t => t.date.startsWith(selectedPeriod)),
    [transactions, selectedPeriod]
  )
}

// Financial formulas
export function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths
  const r = annualRate / 12
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

export function calcAmortizationTable(principal: number, annualRate: number, termMonths: number) {
  const monthlyPayment = calcMonthlyPayment(principal, annualRate, termMonths)
  const r = annualRate / 12
  const rows = []
  let balance = principal
  for (let month = 1; month <= termMonths; month++) {
    const interest = balance * r
    const principalPaid = monthlyPayment - interest
    balance = Math.max(0, balance - principalPaid)
    rows.push({ month, payment: monthlyPayment, principal: principalPaid, interest, balance })
  }
  return rows
}

export function calcSavingsProjection(
  initialAmount: number, monthlyContribution: number,
  annualRate: number, termMonths: number
) {
  const r = annualRate / 12
  const rows = []
  let balance = initialAmount
  let totalContributions = initialAmount
  for (let month = 1; month <= termMonths; month++) {
    balance = balance * (1 + r) + monthlyContribution
    totalContributions += monthlyContribution
    rows.push({ month, balance, contributions: totalContributions, interest: balance - totalContributions })
  }
  return rows
}

export function useUpcomingPayments(days = 7) {
  const { transactions } = useApp()
  return useMemo(() => {
    const today = new Date()
    const future = new Date(today)
    future.setDate(today.getDate() + days)
    return transactions
      .filter(t => t.isRecurring)
      .slice(0, 4)
  }, [transactions, days])
}
