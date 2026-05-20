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
import { Logger } from './utils/logger'

// Captura global de excepciones en el proceso Main
process.on('uncaughtException', (error) => {
  Logger.logError(error, 'MAIN_UNCAUGHT')
})

process.on('unhandledRejection', (reason) => {
  Logger.logError(reason, 'MAIN_UNHANDLED_REJECTION')
})

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
  
  const profileRepo = new ProfileRepository(db)
  const accountRepo = new AccountRepository(db)
  const txRepo = new TransactionRepository(db)
  const budgetRepo = new BudgetRepository(db)
  const goalRepo = new GoalRepository(db)
  const debtRepo = new DebtRepository(db)
  const alertRepo = new AlertRepository(db)

  // --- IPC Handlers ---

  function safeIpcHandle(channel: string, handler: (...args: any[]) => any) {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler(event, ...args)
      } catch (error) {
        const refId = Logger.logError(error, `IPC:${channel}`)
        return {
          isError: true,
          message: 'Ocurrió un error inesperado al procesar la solicitud.',
          ref: refId
        }
      }
    })
  }

  // Profile & Settings
  safeIpcHandle('get-profile', () => profileRepo.getProfile())
  safeIpcHandle('create-profile', (_, profile) => profileRepo.createProfile(profile))
  safeIpcHandle('update-profile', (_, updates) => profileRepo.updateProfile(updates))
  safeIpcHandle('get-alert-settings', (_, userId) => profileRepo.getAlertSettings(userId))
  safeIpcHandle('update-alert-settings', (_, userId, settings) => profileRepo.updateAlertSettings(userId, settings))

  // Net Worth History
  safeIpcHandle('get-net-worth-history', (_, userId) => {
    return db.prepare('SELECT month, assets, liabilities, net_worth as netWorth FROM net_worth_history WHERE user_id = ? ORDER BY month ASC').all(userId) as any[]
  })
  safeIpcHandle('calculate-net-worth-history', (_, userId) => {
    const accounts = db.prepare('SELECT type, balance FROM accounts WHERE user_id = ?').all(userId) as any[]
    let currentAssets = 0
    let currentLiabilities = 0
    for (const acc of accounts) {
      if (acc.type === 'credito') {
        if (acc.balance < 0) {
          currentLiabilities += Math.abs(acc.balance)
        } else {
          currentLiabilities += acc.balance
        }
      } else {
        if (acc.balance > 0) {
          currentAssets += acc.balance
        }
      }
    }
    const txs = db.prepare('SELECT date, amount, type FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userId) as any[]
    const txsByMonth: Record<string, typeof txs> = {}
    for (const tx of txs) {
      const m = tx.date.substring(0, 7)
      if (!txsByMonth[m]) txsByMonth[m] = []
      txsByMonth[m].push(tx)
    }
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStr = d.toISOString().substring(0, 7)
      months.push(mStr)
    }
    const monthsReversed = [...months].reverse()
    const history: any[] = []
    let runningAssets = currentAssets
    let runningLiabilities = currentLiabilities
    for (const mStr of monthsReversed) {
      history.push({
        month: mStr,
        assets: Math.round(runningAssets),
        liabilities: Math.round(runningLiabilities),
        netWorth: Math.round(runningAssets - runningLiabilities)
      })
      const monthTxs = txsByMonth[mStr] || []
      for (const tx of monthTxs) {
        if (tx.type === 'ingreso') {
          runningAssets -= tx.amount
        } else if (tx.type === 'gasto') {
          runningAssets += tx.amount
        }
      }
    }
    const sortedHistory = history.reverse()
    const insertStmt = db.prepare(`
      INSERT INTO net_worth_history (user_id, month, assets, liabilities, net_worth)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, month) DO UPDATE SET
        assets = excluded.assets,
        liabilities = excluded.liabilities,
        net_worth = excluded.net_worth
    `)
    const runTx = db.transaction(() => {
      for (const snap of sortedHistory) {
        insertStmt.run(userId, snap.month, snap.assets, snap.liabilities, snap.netWorth)
      }
    })
    runTx()
    return sortedHistory
  })

  // Accounts
  safeIpcHandle('get-accounts', (_, userId) => accountRepo.getAll(userId))
  safeIpcHandle('add-account', (_, userId, acc) => accountRepo.create(userId, acc))
  safeIpcHandle('update-account', (_, id, updates) => accountRepo.update(id, updates))
  safeIpcHandle('delete-account', (_, id) => accountRepo.delete(id))

  // Transactions
  safeIpcHandle('get-transactions', (_, userId) => txRepo.getAll(userId))
  safeIpcHandle('add-transaction', (_, userId, tx) => txRepo.create(userId, tx))
  safeIpcHandle('delete-transaction', (_, id) => txRepo.delete(id))

  // Budgets
  safeIpcHandle('get-budgets', (_, userId, period) => budgetRepo.getAll(userId, period))
  safeIpcHandle('add-budget', (_, userId, budget) => budgetRepo.create(userId, budget))
  safeIpcHandle('update-budget', (_, id, updates) => budgetRepo.update(id, updates))
  safeIpcHandle('delete-budget', (_, id) => budgetRepo.delete(id))

  // Goals
  safeIpcHandle('get-goals', (_, userId) => goalRepo.getAll(userId))
  safeIpcHandle('add-goal', (_, userId, goal) => goalRepo.create(userId, goal))
  safeIpcHandle('update-goal', (_, id, updates) => goalRepo.update(id, updates))
  safeIpcHandle('delete-goal', (_, id) => goalRepo.delete(id))

  // Debts
  safeIpcHandle('get-debts', (_, userId) => debtRepo.getAll(userId))
  safeIpcHandle('add-debt', (_, userId, debt) => debtRepo.create(userId, debt))
  safeIpcHandle('delete-debt', (_, id) => debtRepo.delete(id))

  // Alerts
  safeIpcHandle('get-alerts', (_, userId) => alertRepo.getAll(userId))
  safeIpcHandle('mark-alert-read', (_, id) => alertRepo.markAsRead(id))
  safeIpcHandle('mark-all-alerts-read', (_, userId) => alertRepo.markAllAsRead(userId))

  // System & Management
  safeIpcHandle('reset-database', async () => {
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

  safeIpcHandle('system:log-renderer-error', (_, errorData) => {
    const { message, stack, url, line, col } = errorData || {}
    const dummyError = {
      name: 'RendererError',
      message: message || 'Unknown React/Renderer error',
      stack: stack || `at ${url || 'unknown'}:${line || 0}:${col || 0}`
    }
    return Logger.logError(dummyError, 'RENDERER')
  })

  safeIpcHandle('parse-pdf', async (event, filePath) => {
    const { detectBank, parsePdfContent } = await import('./parsers/index')
    const pdfRaw = require('pdf-parse')
    console.log('[Main] pdf-parse loaded for parse-pdf preview. Type:', typeof pdfRaw)

    const fs = await import('node:fs')
    console.log('[Main] Starting parse-pdf preview for:', filePath)

    // 1. Leer y extraer texto
    const dataBuffer = fs.readFileSync(filePath)
    let text = ''
    if (pdfRaw && pdfRaw.PDFParse) {
      console.log('[Main] Instantiating PDFParse for preview with data buffer...')
      const parser = new pdfRaw.PDFParse({ data: dataBuffer })
      const result = await parser.getText()
      text = result.text
      await parser.destroy()
    } else {
      const parsePdf = (typeof pdfRaw === 'function') ? pdfRaw : pdfRaw.default
      if (typeof parsePdf !== 'function') {
        throw new Error(`pdf-parse is not a function (it is a ${typeof parsePdf})`)
      }
      const data = await parsePdf(dataBuffer)
      text = data.text
    }
    console.log(`[Main] PDF Text extracted for preview. Length: ${text.length} chars.`)

    // 2. Detectar banco
    const bankId = detectBank(text)
    console.log(`[Main] Bank detected for preview: ${bankId}`)
    
    if (bankId === 'Generic') {
      return { success: false, error: 'Banco no reconocido automáticamente. Asegúrate de que el PDF sea un estado de cuenta original.' }
    }

    // 3. Parsear transacciones
    const parsed = parsePdfContent(bankId, text)
    console.log(`[Main] Transactions parsed for preview: ${parsed.length}`)

    if (parsed.length === 0) {
      return { success: false, error: `No se encontraron transacciones legibles para ${bankId}.` }
    }

    return {
      success: true,
      bank: bankId,
      transactions: parsed
    }
  })

  safeIpcHandle('pdf:parseAndSave', async (event, filePath) => {
    const { detectBank, parsePdfContent } = await import('./parsers/index')
    const { extractAccountMeta } = await import('./parsers/metaExtractor')
    const { inferCategory, generateTxHash } = await import('./utils/categoryInfer')
    const pdfRaw = require('pdf-parse')
    console.log('[Main] pdf-parse loaded. Type:', typeof pdfRaw)

    const fs = await import('node:fs')
    console.log('[Main] Starting PDF parse for:', filePath)

    // 1. Leer y extraer texto
    const dataBuffer = fs.readFileSync(filePath)
    let text = ''
    if (pdfRaw && pdfRaw.PDFParse) {
      console.log('[Main] Instantiating PDFParse with data buffer...')
      const parser = new pdfRaw.PDFParse({ data: dataBuffer })
      const result = await parser.getText()
      text = result.text
      await parser.destroy()
    } else {
      const parsePdf = (typeof pdfRaw === 'function') ? pdfRaw : pdfRaw.default
      if (typeof parsePdf !== 'function') {
        throw new Error(`pdf-parse is not a function (it is a ${typeof parsePdf})`)
      }
      const data = await parsePdf(dataBuffer)
      text = data.text
    }
    console.log(`[Main] PDF Text extracted. Length: ${text.length} chars.`)

    // 2. Detectar banco
    const bankId = detectBank(text)
    console.log(`[Main] Bank detected: ${bankId}`)
    
    if (bankId === 'Generic') {
      return { success: false, error: 'Banco no reconocido automáticamente. Asegúrate de que el PDF sea un estado de cuenta original.' }
    }

    // 3. Extraer metadatos
    const metaResult = extractAccountMeta(text, bankId)
    const metas = Array.isArray(metaResult) ? metaResult : [metaResult]
    
    // 4. Obtener perfil
    const profile = db.prepare('SELECT id FROM profiles LIMIT 1').get() as { id: string }
    if (!profile) return { success: false, error: 'No hay perfil configurado.' }

    const parsed = parsePdfContent(bankId, text)
    console.log(`[Main] Transactions parsed: ${parsed.length}`)

    if (parsed.length === 0 && metas.length === 0) {
      return { success: false, error: `No se encontraron datos legibles para ${bankId}.` }
    }

    const insertAccountStmt = db.prepare(`
      INSERT INTO accounts (user_id, name, bank, type, balance, currency, color, last_four)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, type
    `)

    const insertTxStmt = db.prepare(`
      INSERT OR IGNORE INTO transactions 
      (user_id, account_id, date, amount, type, category, description, source, dedup_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    let inserted = 0
    let duplicates = 0
    const accountMap: Record<string, any> = {}

    // Ejecutamos TODO dentro de una transacción atómica para SQLite
    const transaction = db.transaction((txs) => {
      // Procesar y crear cada subcuenta detectada
      for (const meta of metas) {
        let account = db.prepare(`
          SELECT * FROM accounts 
          WHERE user_id = ? AND bank = ? AND (last_four = ? OR name = ?)
        `).get(profile.id, bankId, meta.lastFour, meta.accountName) as any

        if (!account) {
          console.log('[Main] Creating new account:', meta.accountName)
          const color = bankId === 'Openbank' ? '#0066CC' : bankId === 'BBVA' ? '#004481' : bankId === 'Klar' ? '#00C4B3' : '#820AD1'
          const result = insertAccountStmt.get(
            profile.id, 
            meta.accountName, 
            bankId, 
            meta.accountType, 
            meta.finalBalance || 0, 
            meta.currency,
            color,
            meta.lastFour
          ) as { id: string, type: string }
          account = { id: result.id, name: meta.accountName, type: meta.accountType }
        }
        
        // Mapear por tipo de cuenta (debito, inversion, credito) para enlazar transacciones
        accountMap[meta.accountType] = account
        
        // Actualizar balance
        if (meta.finalBalance !== undefined) {
          db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(meta.finalBalance, account.id)
        }
      }

      // Procesar transacciones
      for (const tx of txs) {
        // Para bancos multi-cuenta como Klar, tx.subAccount nos dice si va a debito o inversion
        // Para bancos de cuenta única, usamos la primera cuenta creada
        let targetAccount = accountMap[tx.subAccount || 'debito'] || Object.values(accountMap)[0]

        if (!targetAccount) continue

        const hash = generateTxHash(tx.date, tx.amount, tx.description)
        const result = insertTxStmt.run(
          profile.id,
          targetAccount.id,
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

    // Lanzamos la transacción
    transaction(parsed)

    return {
      success: true,
      bank: bankId,
      accountName: metas.map(m => m.accountName).join(' + '),
      inserted,
      duplicates
    }
  })

  safeIpcHandle('show-open-dialog', async () => {
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
