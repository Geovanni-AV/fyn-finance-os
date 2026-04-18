import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabase, initSchema } from '../src/db/database'
import { seedDatabase } from '../src/db/seeder'
import { ProfileRepository } from '../src/db/repositories/profile.repository'
import { AccountRepository } from '../src/db/repositories/account.repository'
import { TransactionRepository } from '../src/db/repositories/transaction.repository'
import { BudgetRepository } from '../src/db/repositories/budget.repository'
import { GoalRepository } from '../src/db/repositories/goal.repository'
import { DebtRepository } from '../src/db/repositories/debt.repository'
import { AlertRepository } from '../src/db/repositories/alert.repository'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Desactivar aceleración por hardware para prevenir pantallas en blanco
app.disableHardwareAcceleration()

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 1000,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Fyn Finance OS',
    backgroundColor: '#0e0e0f',
    show: false,
  })

  // win.webContents.openDevTools() // Desactivado para producción

  win.once('ready-to-show', () => {
    win?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    console.log('[Main] Loading URL:', VITE_DEV_SERVER_URL)
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    console.log('[Main] Loading File:', path.join(RENDERER_DIST, 'index.html'))
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Detectar fallos de carga
  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error(`[Main] Failed to load: ${errorCode} - ${errorDescription}`)
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Initialize Database
  const dbPath = path.join(app.getPath('userData'), 'fyn-finance.sqlite')
  const db = getDatabase(dbPath)
  initSchema(db)
  seedDatabase(db)
  
  const profileRepo = new ProfileRepository(db)
  const accountRepo = new AccountRepository(db)
  const txRepo = new TransactionRepository(db)
  const budgetRepo = new BudgetRepository(db)
  const goalRepo = new GoalRepository(db)
  const debtRepo = new DebtRepository(db)
  const alertRepo = new AlertRepository(db)

  // --- IPC Handlers ---

  // Profile
  ipcMain.handle('get-profile', () => profileRepo.getProfile())
  ipcMain.handle('update-profile', (_, updates) => profileRepo.updateProfile(updates))

  // Accounts
  ipcMain.handle('get-accounts', (_, userId) => accountRepo.getAll(userId))
  ipcMain.handle('add-account', (_, userId, acc) => accountRepo.create(userId, acc))
  ipcMain.handle('update-account', (_, id, updates) => accountRepo.update(id, updates))
  ipcMain.handle('delete-account', (_, id) => accountRepo.delete(id))

  // Transactions
  ipcMain.handle('get-transactions', (_, userId) => txRepo.getAll(userId))
  ipcMain.handle('add-transaction', (_, userId, tx) => txRepo.create(userId, tx))
  ipcMain.handle('delete-transaction', (_, id) => txRepo.delete(id))

  // Budgets
  ipcMain.handle('get-budgets', (_, userId, period) => budgetRepo.getAll(userId, period))
  ipcMain.handle('add-budget', (_, userId, budget) => budgetRepo.create(userId, budget))
  ipcMain.handle('update-budget', (_, id, updates) => budgetRepo.update(id, updates))
  ipcMain.handle('delete-budget', (_, id) => budgetRepo.delete(id))

  // Goals
  ipcMain.handle('get-goals', (_, userId) => goalRepo.getAll(userId))
  ipcMain.handle('add-goal', (_, userId, goal) => goalRepo.create(userId, goal))
  ipcMain.handle('update-goal', (_, id, updates) => goalRepo.update(id, updates))
  ipcMain.handle('delete-goal', (_, id) => goalRepo.delete(id))

  // Debts
  ipcMain.handle('get-debts', (_, userId) => debtRepo.getAll(userId))
  ipcMain.handle('add-debt', (_, userId, debt) => debtRepo.create(userId, debt))
  ipcMain.handle('delete-debt', (_, id) => debtRepo.delete(id))

  // Alerts
  ipcMain.handle('get-alerts', (_, userId) => alertRepo.getAll(userId))
  ipcMain.handle('mark-alert-read', (_, id) => alertRepo.markAsRead(id))
  ipcMain.handle('mark-all-alerts-read', (_, userId) => alertRepo.markAllAsRead(userId))

  // System & Management
  ipcMain.handle('reset-database', async () => {
    console.log('[Main] Resetting database...')
    db.prepare('DELETE FROM alerts').run()
    db.prepare('DELETE FROM transactions').run()
    db.prepare('DELETE FROM accounts').run()
    db.prepare('DELETE FROM saving_goals').run()
    db.prepare('DELETE FROM budgets').run()
    db.prepare('DELETE FROM debts').run()
    db.prepare('DELETE FROM net_worth_history').run()
    db.prepare('DELETE FROM profiles').run()
    return true
  })

  console.log('Database initialized at:', dbPath)

  createWindow()
})
