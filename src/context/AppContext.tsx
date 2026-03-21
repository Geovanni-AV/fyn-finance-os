import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AppState, Transaction, Account, SavingGoal, Budget, UserProfile, AlertSettings, Alert } from '../types'
import { mockAccounts, mockTransactions, mockBudgets, mockGoals, mockDebts, mockAlerts, mockNetWorthHistory, mockProfile, mockAlertSettings } from '../mockData'

interface AppContextType extends AppState {
  addTransaction: (tx: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
  addAccount: (acc: Omit<Account, 'id'>) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  addGoal: (goal: Omit<SavingGoal, 'id'>) => void
  updateGoal: (id: string, updates: Partial<SavingGoal>) => void
  updateBudget: (id: string, updates: Partial<Budget>) => void
  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
  updateAlertSettings: (updates: Partial<AlertSettings>) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState(mockAccounts)
  const [transactions, setTransactions] = useState(mockTransactions)
  const [budgets, setBudgets] = useState(mockBudgets)
  const [goals, setGoals] = useState(mockGoals)
  const [debts] = useState(mockDebts)
  const [alerts, setAlerts] = useState(mockAlerts)
  const [netWorthHistory] = useState(mockNetWorthHistory)
  const [profile, setProfile] = useState(mockProfile)
  const [alertSettings, setAlertSettings] = useState(mockAlertSettings)

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` }
    setTransactions(prev => [newTx, ...prev])
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  const addAccount = useCallback((acc: Omit<Account, 'id'>) => {
    setAccounts(prev => [...prev, { ...acc, id: `acc-${Date.now()}` }])
  }, [])

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }, [])

  const addGoal = useCallback((goal: Omit<SavingGoal, 'id'>) => {
    setGoals(prev => [...prev, { ...goal, id: `goal-${Date.now()}` }])
  }, [])

  const updateGoal = useCallback((id: string, updates: Partial<SavingGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }, [])

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }, [])

  const markAllAlertsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const updateAlertSettings = useCallback((updates: Partial<AlertSettings>) => {
    setAlertSettings(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <AppContext.Provider value={{
      accounts, transactions, budgets, goals, debts, alerts,
      netWorthHistory, profile, alertSettings,
      addTransaction, deleteTransaction, addAccount, updateAccount,
      addGoal, updateGoal, updateBudget, markAlertRead, markAllAlertsRead,
      updateProfile, updateAlertSettings,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
