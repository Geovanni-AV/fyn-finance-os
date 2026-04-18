import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import Database from "better-sqlite3";
let dbInstance = null;
function getDatabase(dbPath) {
  if (dbInstance) return dbInstance;
  const finalPath = dbPath || "fyn-finance.sqlite";
  dbInstance = new Database(finalPath, {
    verbose: console.log
  });
  dbInstance.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
  return dbInstance;
}
function initSchema(db) {
  db.exec(`
    -- PROFILES
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      currency TEXT DEFAULT 'MXN',
      theme TEXT DEFAULT 'dark',
      onboarding_done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ACCOUNTS
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      bank TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('debito','credito','efectivo','inversion')),
      balance REAL DEFAULT 0,
      credit_limit REAL,
      currency TEXT DEFAULT 'MXN',
      color TEXT DEFAULT '#2563EB',
      last_four TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- TRANSACTIONS
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('gasto','ingreso','transferencia')),
      category TEXT NOT NULL,
      description TEXT,
      source TEXT DEFAULT 'manual' CHECK (source IN ('manual','ocr','pdf','sync')),
      is_recurring INTEGER DEFAULT 0,
      recurrence_period TEXT,
      tags TEXT DEFAULT '[]',
      notes TEXT,
      dedup_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_dedup ON transactions(user_id, dedup_hash) WHERE dedup_hash IS NOT NULL;

    -- BUDGETS
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      period TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, category, period)
    );

    -- SAVING GOALS
    CREATE TABLE IF NOT EXISTS saving_goals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date TEXT,
      monthly_contribution REAL DEFAULT 0,
      expected_return REAL DEFAULT 0.07,
      color TEXT DEFAULT '#2563EB',
      icon TEXT DEFAULT 'savings',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- DEBTS
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL,
      original_balance REAL NOT NULL,
      interest_rate REAL NOT NULL,
      minimum_payment REAL NOT NULL,
      due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
      account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ALERTS
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('info','warning','danger','success')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      related_entity_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ALERT SETTINGS
    CREATE TABLE IF NOT EXISTS alert_settings (
      user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      presupuesto_alerta INTEGER DEFAULT 1,
      presupuesto_excedido INTEGER DEFAULT 1,
      pago_proximo INTEGER DEFAULT 1,
      pago_vencido INTEGER DEFAULT 1,
      meta_lograda INTEGER DEFAULT 1,
      saldo_bajo INTEGER DEFAULT 1,
      gasto_inusual INTEGER DEFAULT 0,
      racha_ahorro INTEGER DEFAULT 1,
      resumen_semanal INTEGER DEFAULT 0
    );

    -- NET WORTH HISTORY
    CREATE TABLE IF NOT EXISTS net_worth_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      assets REAL NOT NULL,
      liabilities REAL NOT NULL,
      net_worth REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, month)
    );

    -- SETTINGS
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
function seedDatabase(db) {
  console.log("Database ready for user data.");
}
class ProfileRepository {
  constructor(db) {
    this.db = db;
  }
  getProfile() {
    const row = this.db.prepare("SELECT * FROM profiles LIMIT 1").get();
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      currency: row.currency,
      theme: row.theme,
      onboardingDone: Boolean(row.onboarding_done)
    };
  }
  createProfile(profile) {
    const id = profile.id || void 0;
    const name = profile.name || "Usuario";
    const email = profile.email || "";
    const currency = profile.currency || "MXN";
    const theme = profile.theme || "dark";
    const onboardingDone = profile.onboardingDone ? 1 : 0;
    const stmt = this.db.prepare(`
      INSERT INTO profiles (id, name, email, currency, theme, onboarding_done)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(id, name, email, currency, theme, onboardingDone);
    return id || info.lastInsertRowid;
  }
  updateProfile(profile) {
    if (!profile.id) return;
    const fields = [];
    const params = [];
    if (profile.name) {
      fields.push("name = ?");
      params.push(profile.name);
    }
    if (profile.email) {
      fields.push("email = ?");
      params.push(profile.email);
    }
    if (profile.currency) {
      fields.push("currency = ?");
      params.push(profile.currency);
    }
    if (profile.theme) {
      fields.push("theme = ?");
      params.push(profile.theme);
    }
    if (profile.onboardingDone !== void 0) {
      fields.push("onboarding_done = ?");
      params.push(profile.onboardingDone ? 1 : 0);
    }
    if (fields.length === 0) return;
    params.push(profile.id);
    const sql = `UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`;
    this.db.prepare(sql).run(...params);
  }
}
class AccountRepository {
  constructor(db) {
    this.db = db;
  }
  getAll(userId) {
    const rows = this.db.prepare("SELECT * FROM accounts WHERE user_id = ?").all(userId);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      bank: row.bank,
      type: row.type,
      balance: row.balance,
      creditLimit: row.credit_limit,
      currency: row.currency,
      color: row.color,
      lastFour: row.last_four,
      isActive: Boolean(row.is_active)
    }));
  }
  create(userId, account) {
    const id = account.id || void 0;
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, user_id, name, bank, type, balance, credit_limit, currency, color, last_four, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      account.name,
      account.bank,
      account.type,
      account.balance || 0,
      account.creditLimit || null,
      account.currency || "MXN",
      account.color || "#2563EB",
      account.lastFour || null,
      account.isActive !== false ? 1 : 0
    );
    return id || "unknown";
  }
  update(id, updates) {
    const fields = [];
    const params = [];
    if (updates.name) {
      fields.push("name = ?");
      params.push(updates.name);
    }
    if (updates.bank) {
      fields.push("bank = ?");
      params.push(updates.bank);
    }
    if (updates.type) {
      fields.push("type = ?");
      params.push(updates.type);
    }
    if (updates.balance !== void 0) {
      fields.push("balance = ?");
      params.push(updates.balance);
    }
    if (updates.creditLimit !== void 0) {
      fields.push("credit_limit = ?");
      params.push(updates.creditLimit);
    }
    if (updates.currency) {
      fields.push("currency = ?");
      params.push(updates.currency);
    }
    if (updates.color) {
      fields.push("color = ?");
      params.push(updates.color);
    }
    if (updates.lastFour) {
      fields.push("last_four = ?");
      params.push(updates.lastFour);
    }
    if (updates.isActive !== void 0) {
      fields.push("is_active = ?");
      params.push(updates.isActive ? 1 : 0);
    }
    if (fields.length === 0) return;
    params.push(id);
    const sql = `UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`;
    this.db.prepare(sql).run(...params);
  }
  delete(id) {
    this.db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  }
}
class TransactionRepository {
  constructor(db) {
    this.db = db;
  }
  getAll(userId) {
    const rows = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC
    `).all(userId);
    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      amount: row.amount,
      type: row.type,
      category: row.category,
      description: row.description,
      accountId: row.account_id,
      source: row.source,
      isRecurring: Boolean(row.is_recurring),
      recurrencePeriod: row.recurrence_period,
      tags: JSON.parse(row.tags || "[]"),
      notes: row.notes
    }));
  }
  create(userId, tx) {
    const id = tx.id || void 0;
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, user_id, account_id, date, amount, type, category, description, source, is_recurring, recurrence_period, tags, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      tx.accountId,
      tx.date,
      tx.amount,
      tx.type,
      tx.category,
      tx.description || "",
      tx.source || "manual",
      tx.isRecurring ? 1 : 0,
      tx.recurrencePeriod || null,
      JSON.stringify(tx.tags || []),
      tx.notes || null
    );
    return id || "unknown";
  }
  delete(id) {
    this.db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  }
}
class BudgetRepository {
  constructor(db) {
    this.db = db;
  }
  getAll(userId, period) {
    const rows = this.db.prepare("SELECT * FROM budgets WHERE user_id = ? AND period = ?").all(userId, period);
    return rows.map((row) => ({
      id: row.id,
      category: row.category,
      monthlyLimit: row.monthly_limit,
      period: row.period,
      spent: 0
      // In a real app we'd calculate this from transactions
    }));
  }
  create(userId, budget) {
    const id = budget.id || void 0;
    const stmt = this.db.prepare(`
      INSERT INTO budgets (id, user_id, category, monthly_limit, period)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, budget.category, budget.monthlyLimit, budget.period);
    return id || "unknown";
  }
  update(id, updates) {
    const fields = [];
    const params = [];
    if (updates.category) {
      fields.push("category = ?");
      params.push(updates.category);
    }
    if (updates.monthlyLimit !== void 0) {
      fields.push("monthly_limit = ?");
      params.push(updates.monthlyLimit);
    }
    if (updates.period) {
      fields.push("period = ?");
      params.push(updates.period);
    }
    if (fields.length === 0) return;
    params.push(id);
    const sql = `UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`;
    this.db.prepare(sql).run(...params);
  }
  delete(id) {
    this.db.prepare("DELETE FROM budgets WHERE id = ?").run(id);
  }
}
class GoalRepository {
  constructor(db) {
    this.db = db;
  }
  getAll(userId) {
    const rows = this.db.prepare("SELECT * FROM saving_goals WHERE user_id = ?").all(userId);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      targetDate: row.target_date,
      monthlyContribution: row.monthly_contribution,
      expectedReturn: row.expected_return,
      color: row.color,
      icon: row.icon
    }));
  }
  create(userId, goal) {
    const id = goal.id || void 0;
    const stmt = this.db.prepare(`
      INSERT INTO saving_goals (id, user_id, name, type, target_amount, current_amount, target_date, monthly_contribution, expected_return, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      goal.name,
      goal.type,
      goal.targetAmount,
      goal.currentAmount || 0,
      goal.targetDate,
      goal.monthlyContribution || 0,
      goal.expectedReturn || 0.07,
      goal.color || "#2563EB",
      goal.icon || "savings"
    );
    return id || "unknown";
  }
  update(id, updates) {
    const fields = [];
    const params = [];
    if (updates.name) {
      fields.push("name = ?");
      params.push(updates.name);
    }
    if (updates.type) {
      fields.push("type = ?");
      params.push(updates.type);
    }
    if (updates.targetAmount !== void 0) {
      fields.push("target_amount = ?");
      params.push(updates.targetAmount);
    }
    if (updates.currentAmount !== void 0) {
      fields.push("current_amount = ?");
      params.push(updates.currentAmount);
    }
    if (updates.targetDate) {
      fields.push("target_date = ?");
      params.push(updates.targetDate);
    }
    if (updates.monthlyContribution !== void 0) {
      fields.push("monthly_contribution = ?");
      params.push(updates.monthlyContribution);
    }
    if (updates.expectedReturn !== void 0) {
      fields.push("expected_return = ?");
      params.push(updates.expectedReturn);
    }
    if (updates.color) {
      fields.push("color = ?");
      params.push(updates.color);
    }
    if (updates.icon) {
      fields.push("icon = ?");
      params.push(updates.icon);
    }
    if (fields.length === 0) return;
    params.push(id);
    const sql = `UPDATE saving_goals SET ${fields.join(", ")} WHERE id = ?`;
    this.db.prepare(sql).run(...params);
  }
  delete(id) {
    this.db.prepare("DELETE FROM saving_goals WHERE id = ?").run(id);
  }
}
class DebtRepository {
  constructor(db) {
    this.db = db;
  }
  getAll(userId) {
    const rows = this.db.prepare("SELECT * FROM debts WHERE user_id = ?").all(userId);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: row.balance,
      originalBalance: row.original_balance,
      interestRate: row.interest_rate,
      minimumPayment: row.minimum_payment,
      dueDay: row.due_day,
      accountId: row.account_id
    }));
  }
  create(userId, debt) {
    const id = debt.id || void 0;
    const stmt = this.db.prepare(`
      INSERT INTO debts (id, user_id, name, type, balance, original_balance, interest_rate, minimum_payment, due_day, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      debt.name,
      debt.type,
      debt.balance,
      debt.originalBalance,
      debt.interestRate,
      debt.minimumPayment,
      debt.dueDay,
      debt.accountId || null
    );
    return id || "unknown";
  }
  delete(id) {
    this.db.prepare("DELETE FROM debts WHERE id = ?").run(id);
  }
}
class AlertRepository {
  constructor(db) {
    this.db = db;
  }
  getAll(userId) {
    const rows = this.db.prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      date: row.created_at,
      isRead: Boolean(row.is_read)
    }));
  }
  markAsRead(id) {
    this.db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ?").run(id);
  }
  markAllAsRead(userId) {
    this.db.prepare("UPDATE alerts SET is_read = 1 WHERE user_id = ?").run(userId);
  }
  create(userId, alert) {
    const stmt = this.db.prepare(`
      INSERT INTO alerts (id, user_id, type, severity, title, message, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      alert.id || void 0,
      userId,
      alert.type,
      alert.severity,
      alert.title,
      alert.message,
      alert.isRead ? 1 : 0
    );
  }
}
const require$1 = createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
app.disableHardwareAcceleration();
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 1e3,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js")
    },
    title: "Fyn Finance OS",
    backgroundColor: "#0e0e0f",
    show: false
  });
  const originalLog = console.log;
  const originalError = console.error;
  const sendLog = (type, message) => {
    if (win == null ? void 0 : win.webContents) {
      originalLog(`[Internal ${type}]`, message);
      win.webContents.send("system:log", {
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
        type,
        message: typeof message === "object" ? JSON.stringify(message, null, 2) : String(message)
      });
    }
  };
  console.log = (...args) => {
    originalLog(...args);
    sendLog("INFO", args.join(" "));
  };
  console.error = (...args) => {
    originalError(...args);
    sendLog("ERROR", args.join(" "));
  };
  win.once("ready-to-show", () => {
    win == null ? void 0 : win.show();
  });
  if (VITE_DEV_SERVER_URL) {
    console.log("[Main] Loading URL:", VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    console.log("[Main] Loading File:", path.join(RENDERER_DIST, "index.html"));
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.on("did-fail-load", (_, errorCode, errorDescription) => {
    console.error(`[Main] Failed to load: ${errorCode} - ${errorDescription}`);
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  const dbPath = path.join(app.getPath("userData"), "fyn-finance.sqlite");
  const db = getDatabase(dbPath);
  initSchema(db);
  seedDatabase();
  const profileRepo = new ProfileRepository(db);
  const accountRepo = new AccountRepository(db);
  const txRepo = new TransactionRepository(db);
  const budgetRepo = new BudgetRepository(db);
  const goalRepo = new GoalRepository(db);
  const debtRepo = new DebtRepository(db);
  const alertRepo = new AlertRepository(db);
  ipcMain.handle("get-profile", () => profileRepo.getProfile());
  ipcMain.handle("update-profile", (_, updates) => profileRepo.updateProfile(updates));
  ipcMain.handle("get-accounts", (_, userId) => accountRepo.getAll(userId));
  ipcMain.handle("add-account", (_, userId, acc) => accountRepo.create(userId, acc));
  ipcMain.handle("update-account", (_, id, updates) => accountRepo.update(id, updates));
  ipcMain.handle("delete-account", (_, id) => accountRepo.delete(id));
  ipcMain.handle("get-transactions", (_, userId) => txRepo.getAll(userId));
  ipcMain.handle("add-transaction", (_, userId, tx) => txRepo.create(userId, tx));
  ipcMain.handle("delete-transaction", (_, id) => txRepo.delete(id));
  ipcMain.handle("get-budgets", (_, userId, period) => budgetRepo.getAll(userId, period));
  ipcMain.handle("add-budget", (_, userId, budget) => budgetRepo.create(userId, budget));
  ipcMain.handle("update-budget", (_, id, updates) => budgetRepo.update(id, updates));
  ipcMain.handle("delete-budget", (_, id) => budgetRepo.delete(id));
  ipcMain.handle("get-goals", (_, userId) => goalRepo.getAll(userId));
  ipcMain.handle("add-goal", (_, userId, goal) => goalRepo.create(userId, goal));
  ipcMain.handle("update-goal", (_, id, updates) => goalRepo.update(id, updates));
  ipcMain.handle("delete-goal", (_, id) => goalRepo.delete(id));
  ipcMain.handle("get-debts", (_, userId) => debtRepo.getAll(userId));
  ipcMain.handle("add-debt", (_, userId, debt) => debtRepo.create(userId, debt));
  ipcMain.handle("delete-debt", (_, id) => debtRepo.delete(id));
  ipcMain.handle("get-alerts", (_, userId) => alertRepo.getAll(userId));
  ipcMain.handle("mark-alert-read", (_, id) => alertRepo.markAsRead(id));
  ipcMain.handle("mark-all-alerts-read", (_, userId) => alertRepo.markAllAsRead(userId));
  ipcMain.handle("reset-database", async () => {
    console.log("[Main] Resetting database...");
    db.prepare("DELETE FROM alerts").run();
    db.prepare("DELETE FROM transactions").run();
    db.prepare("DELETE FROM accounts").run();
    db.prepare("DELETE FROM saving_goals").run();
    db.prepare("DELETE FROM budgets").run();
    db.prepare("DELETE FROM debts").run();
    db.prepare("DELETE FROM net_worth_history").run();
    db.prepare("DELETE FROM profiles").run();
    return true;
  });
  ipcMain.handle("pdf:parseAndSave", async (event, filePath) => {
    try {
      const { detectBank, parsePdfContent } = await import("./index-CA6deghI.js");
      const { extractAccountMeta } = await import("./metaExtractor-DH8tcHXP.js");
      const { inferCategory, generateTxHash } = await import("./categoryInfer-Bf2rSKEv.js");
      const pdfRaw = require$1("pdf-parse");
      console.log("[Main] pdf-parse loaded. Type:", typeof pdfRaw);
      const parsePdf = typeof pdfRaw === "function" ? pdfRaw : pdfRaw.default;
      if (typeof parsePdf !== "function") {
        throw new Error(`pdf-parse is not a function (it is a ${typeof parsePdf})`);
      }
      const fs = await import("node:fs");
      console.log("[Main] Starting PDF parse for:", filePath);
      const dataBuffer = fs.readFileSync(filePath);
      const data = await parsePdf(dataBuffer);
      const text = data.text;
      const bankId = detectBank(text);
      if (bankId === "Generic") {
        return { success: false, error: "Banco no reconocido automáticamente." };
      }
      const meta = extractAccountMeta(text, bankId);
      const profile = db.prepare("SELECT id FROM profiles LIMIT 1").get();
      if (!profile) return { success: false, error: "No hay perfil configurado." };
      let account = db.prepare(`
        SELECT * FROM accounts 
        WHERE user_id = ? AND bank = ? AND (last_four = ? OR name = ?)
      `).get(profile.id, bankId, meta.lastFour, meta.accountName);
      if (!account) {
        console.log("[Main] Creating new account:", meta.accountName);
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
          bankId === "Openbank" ? "#0066CC" : bankId === "BBVA" ? "#004481" : "#820AD1",
          meta.lastFour
        );
        account = { id: result.lastInsertRowid.toString(), name: meta.accountName };
      }
      const parsed = parsePdfContent(bankId, text);
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO transactions 
        (user_id, account_id, date, amount, type, category, description, source, dedup_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let inserted = 0;
      let duplicates = 0;
      const transaction = db.transaction((txs) => {
        for (const tx of txs) {
          const hash = generateTxHash(tx.date, tx.amount, tx.description);
          const result = insertStmt.run(
            profile.id,
            account.id,
            tx.date,
            tx.amount,
            tx.type,
            inferCategory(tx.description, tx.type),
            tx.description,
            "pdf",
            hash
          );
          if (result.changes > 0) inserted++;
          else duplicates++;
        }
      });
      transaction(parsed);
      if (meta.finalBalance !== void 0) {
        db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(meta.finalBalance, account.id);
      }
      return {
        success: true,
        bank: bankId,
        accountName: account.name,
        inserted,
        duplicates
      };
    } catch (error) {
      console.error("[Main] automated parse error:", error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("show-open-dialog", async () => {
    const { dialog } = await import("electron");
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Documentos PDF", extensions: ["pdf"] }]
    });
    return result.filePaths[0];
  });
  console.log("Database initialized at:", dbPath);
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
//# sourceMappingURL=main.js.map
