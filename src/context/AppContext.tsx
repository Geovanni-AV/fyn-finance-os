import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AppState, Transaction, Account, SavingGoal, Budget, UserProfile, AlertSettings, Alert, Debt, NetWorthSnapshot } from '../types'
import { useAuth } from './AuthContext'

interface AppContextType extends AppState {
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addAccount: (acc: Omit<Account, 'id'>) => Promise<void>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  addGoal: (goal: Omit<SavingGoal, 'id'>) => Promise<void>
  updateGoal: (id: string, updates: Partial<SavingGoal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  addDebt: (debt: Omit<Debt, 'id'>) => Promise<void>
  deleteDebt: (id: string) => Promise<void>
  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updateAlertSettings: (updates: Partial<AlertSettings>) => Promise<void>
  refreshData: () => Promise<void>
}

const defaultProfile: UserProfile = {
  name: '',
  email: '',
  currency: 'MXN',
  theme: 'dark'
}

const defaultAlertSettings: AlertSettings = {
  presupuestoAlerta: true,
  presupuestoExcedido: true,
  pagoProximo: true,
  pagoVencido: true,
  metaLograda: true,
  saldoBajo: true,
  gastoInusual: false,
  rachaAhorro: true,
  resumenSemanal: false
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isElectron } = useAuth()
  
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>([])
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(defaultAlertSettings)
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(async () => {
    if (isElectron && user) {
      console.log('[App] Loading user data from SQLite...')
      const electron = (window as any).electronAPI
      if (!electron) {
        setLoading(false)
        return
      }

      try {
        // Primero calcular el historial dinámico para asegurarnos de que esté sincronizado
        await electron.invoke('calculate-net-worth-history', user.id)

        const [dbAccounts, dbTransactions, dbGoals, dbDebts, dbAlerts, dbProfile, dbAlertSettings, dbNetWorth] = await Promise.all([
          electron.invoke('get-accounts', user.id),
          electron.invoke('get-transactions', user.id),
          electron.invoke('get-goals', user.id),
          electron.invoke('get-debts', user.id),
          electron.invoke('get-alerts', user.id),
          electron.invoke('get-profile'),
          electron.invoke('get-alert-settings', user.id),
          electron.invoke('get-net-worth-history', user.id),
        ])

        setAccounts(dbAccounts || [])
        setTransactions(dbTransactions || [])
        setGoals(dbGoals || [])
        setDebts(dbDebts || [])
        setAlerts(dbAlerts || [])
        setNetWorthHistory(dbNetWorth || [])
        if (dbProfile) {
          setProfile(dbProfile)
        } else {
          setProfile(defaultProfile)
        }
        if (dbAlertSettings) {
          setAlertSettings(dbAlertSettings)
        } else {
          setAlertSettings(defaultAlertSettings)
        }
        
        const currentMonth = new Date().toISOString().slice(0, 7)
        const dbBudgets = await electron.invoke('get-budgets', user.id, currentMonth)
        setBudgets(dbBudgets || [])
      
      } catch (error) {
        console.error('[App] Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    } else {
      console.log('[App] Mode: Mock/Empty (No user or not Electron)')
      setAccounts([])
      setTransactions([])
      setBudgets([])
      setGoals([])
      setDebts([])
      setAlerts([])
      setNetWorthHistory([])
      setProfile(defaultProfile)
      setAlertSettings(defaultAlertSettings)
      setLoading(false)
    }
  }, [isElectron, user])

  useEffect(() => {
    setLoading(true)
    refreshData()
  }, [refreshData])

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    if (isElectron && user) {
      const id = await (window as any).electronAPI.invoke('add-transaction', user.id, tx)
      const newTx = { ...tx, id } as Transaction
      setTransactions(prev => [newTx, ...prev])
      return
    }
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` }
    setTransactions(prev => [newTx, ...prev])
  }, [isElectron, user])

  const deleteTransaction = useCallback(async (id: string) => {
    if (isElectron) await (window as any).electronAPI.invoke('delete-transaction', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [isElectron])

  const addAccount = useCallback(async (acc: Omit<Account, 'id'>) => {
    if (isElectron && user) {
      const id = await (window as any).electronAPI.invoke('add-account', user.id, acc)
      setAccounts(prev => [...prev, { ...acc, id } as Account])
      return
    }
    setAccounts(prev => [...prev, { ...acc, id: `acc-${Date.now()}` }])
  }, [isElectron, user])

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    if (isElectron) await (window as any).electronAPI.invoke('update-account', id, updates)
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }, [isElectron])

  const deleteAccount = useCallback(async (id: string) => {
    if (isElectron) await (window as any).electronAPI.invoke('delete-account', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }, [isElectron])

  const addGoal = useCallback(async (goal: Omit<SavingGoal, 'id'>) => {
    if (isElectron && user) {
      const id = await (window as any).electronAPI.invoke('add-goal', user.id, goal)
      setGoals(prev => [...prev, { ...goal, id } as SavingGoal])
      return
    }
    setGoals(prev => [...prev, { ...goal, id: `goal-${Date.now()}` }])
  }, [isElectron, user])

  const updateGoal = useCallback(async (id: string, updates: Partial<SavingGoal>) => {
    if (isElectron) await (window as any).electronAPI.invoke('update-goal', id, updates)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  }, [isElectron])

  const deleteGoal = useCallback(async (id: string) => {
    if (isElectron) await (window as any).electronAPI.invoke('delete-goal', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [isElectron])

  const addBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    if (isElectron && user) {
      const id = await (window as any).electronAPI.invoke('add-budget', user.id, budget)
      setBudgets(prev => [...prev, { ...budget, id } as Budget])
      return
    }
    setBudgets(prev => [...prev, { ...budget, id: `bud-${Date.now()}` }])
  }, [isElectron, user])

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    if (isElectron) await (window as any).electronAPI.invoke('update-budget', id, updates)
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [isElectron])

  const deleteBudget = useCallback(async (id: string) => {
    if (isElectron) await (window as any).electronAPI.invoke('delete-budget', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }, [isElectron])

  const addDebt = useCallback(async (debt: Omit<Debt, 'id'>) => {
    if (isElectron && user) {
      const id = await (window as any).electronAPI.invoke('add-debt', user.id, debt)
      setDebts(prev => [...prev, { ...debt, id } as Debt])
      return
    }
    setDebts(prev => [...prev, { ...debt, id: `debt-${Date.now()}` }])
  }, [isElectron, user])

  const deleteDebt = useCallback(async (id: string) => {
    if (isElectron) await (window as any).electronAPI.invoke('delete-debt', id)
    setDebts(prev => prev.filter(d => d.id !== id))
  }, [isElectron])

  const markAlertRead = useCallback((id: string) => {
    if (isElectron) (window as any).electronAPI.invoke('mark-alert-read', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }, [isElectron])

  const markAllAlertsRead = useCallback(() => {
    if (isElectron && user) (window as any).electronAPI.invoke('mark-all-alerts-read', user.id)
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))
  }, [isElectron, user])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (isElectron && user) await (window as any).electronAPI.invoke('update-profile', { ...updates, id: user.id })
    setProfile(prev => ({ ...prev, ...updates }))
  }, [isElectron, user])

  const updateAlertSettings = useCallback(async (updates: Partial<AlertSettings>) => {
    if (isElectron && user) await (window as any).electronAPI.invoke('update-alert-settings', user.id, updates)
    setAlertSettings(prev => ({ ...prev, ...updates }))
  }, [isElectron, user])

  return (
    <AppContext.Provider value={{
      accounts, transactions, budgets, goals, debts, alerts,
      netWorthHistory, profile, alertSettings,
      addTransaction, deleteTransaction, addAccount, updateAccount, deleteAccount,
      addGoal, updateGoal, deleteGoal, addBudget, updateBudget, deleteBudget,
      addDebt, deleteDebt, markAlertRead, markAllAlertsRead,
      updateProfile, updateAlertSettings, refreshData,
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
