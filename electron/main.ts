import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { getDatabase, initSchema } from '../src/db/database'
import { seedDatabase } from '../src/db/seeder'
import { ProfileRepository } from '../src/db/repositories/profile.repository'
import { AccountRepository } from '../src/db/repositories/account.repository'
import { TransactionRepository } from '../src/db/repositories/transaction.repository'
import { BudgetRepository } from '../src/db/repositories/budget.repository'
import { GoalRepository } from '../src/db/repositories/goal.repository'
import { DebtRepository } from '../src/db/repositories/debt.repository'
import { AlertRepository } from '../src/db/repositories/alert.repository'

const require = createRequire(import.meta.url)
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

  // Guardar referencias originales para evitar recursión infinita
  const originalLog = console.log;
  const originalError = console.error;

  // Función para enviar logs a la UI sin causar loop
  const sendLog = (type: string, message: any) => {
    if (win?.webContents) {
      // Usar original para no entrar en bucle
      originalLog(`[Internal ${type}]`, message)
      win.webContents.send('system:log', { 
        timestamp: new Date().toLocaleTimeString(),
        type, 
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message) 
      })
    }
  }

  // Interceptar logs normales para enviarlos también a la UI
  console.log = (...args) => {
    originalLog(...args);
    sendLog('INFO', args.join(' '));
  };

  console.error = (...args) => {
    originalError(...args);
    sendLog('ERROR', args.join(' '));
  };

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

  ipcMain.handle('pdf:parseAndSave', async (event, filePath) => {
    try {
      const { detectBank, parsePdfContent } = await import('./parsers/index')
      const { extractAccountMeta } = await import('./parsers/metaExtractor')
      const { inferCategory, generateTxHash } = await import('./utils/categoryInfer')
      const pdfRaw = require('pdf-parse')
      console.log('[Main] pdf-parse loaded. Type:', typeof pdfRaw)

      // Determinar la función de parseo real
      const parsePdf = (typeof pdfRaw === 'function') ? pdfRaw : pdfRaw.default
      
      if (typeof parsePdf !== 'function') {
        throw new Error(`pdf-parse is not a function (it is a ${typeof parsePdf})`)
      }

      const fs = await import('node:fs')
      console.log('[Main] Starting PDF parse for:', filePath)

      // 1. Leer y extraer texto
      const dataBuffer = fs.readFileSync(filePath)
      const data = await parsePdf(dataBuffer)
      const text = data.text
      console.log(`[Main] PDF Text extracted. Length: ${text.length} chars.`)

      // 2. Detectar banco
      const bankId = detectBank(text)
      console.log(`[Main] Bank detected: ${bankId}`)
      
      if (bankId === 'Generic') {
        return { success: false, error: 'Banco no reconocido automáticamente. Asegúrate de que el PDF sea un estado de cuenta original.' }
      }

      // 3. Extraer metadatos
      const meta = extractAccountMeta(text, bankId)
      
      // 4. Obtener perfil
      const profile = db.prepare('SELECT id FROM profiles LIMIT 1').get() as { id: string }
      if (!profile) return { success: false, error: 'No hay perfil configurado.' }

      // 5. Buscar o crear cuenta
      let account = db.prepare(`
        SELECT * FROM accounts 
        WHERE user_id = ? AND bank = ? AND (last_four = ? OR name = ?)
      `).get(profile.id, bankId, meta.lastFour, meta.accountName) as any

      if (!account) {
        console.log('[Main] Creating new account:', meta.accountName)
        const result = db.prepare(`
          INSERT INTO accounts (user_id, name, bank, type, balance, currency, color, last_four)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          profile.id, 
          meta.accountName, 
          bankId, 
          meta.accountType, 
          meta.finalBalance || 0, 
          meta.currency,
          bankId === 'Openbank' ? '#0066CC' : bankId === 'BBVA' ? '#004481' : '#820AD1',
          meta.lastFour
        )
        account = { id: result.lastInsertRowid.toString(), name: meta.accountName }
      }
      
      // 6. Parsear transacciones
      const parsed = parsePdfContent(bankId, text)
      console.log(`[Main] Transactions parsed: ${parsed.length}`)

      if (parsed.length === 0) {
        return { success: false, error: `No se encontraron transacciones legibles para ${bankId}.` }
      }
      
      // 7. Insertar con deduplicación
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO transactions 
        (user_id, account_id, date, amount, type, category, description, source, dedup_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      let inserted = 0
      let duplicates = 0

      const transaction = db.transaction((txs) => {
        for (const tx of txs) {
          const hash = generateTxHash(tx.date, tx.amount, tx.description)
          const result = insertStmt.run(
            profile.id,
            account.id,
            tx.date,
            tx.amount,
            tx.type,
            inferCategory(tx.description, tx.type),
            tx.description,
            'pdf',
            hash
          )
          if (result.changes > 0) inserted++
          else duplicates++
        }
      })

      transaction(parsed)

      // 8. Actualizar saldo final si se detectó
      if (meta.finalBalance !== undefined) {
        db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(meta.finalBalance, account.id)
      }

      return {
        success: true,
        bank: bankId,
        accountName: account.name,
        inserted,
        duplicates
      }
    } catch (error: any) {
      console.error('[Main] automated parse error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('show-open-dialog', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
    })
    return result.filePaths[0]
  })

  console.log('Database initialized at:', dbPath)

  createWindow()
})
