var q = Object.defineProperty;
var J = (l, t, e) => t in l ? q(l, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : l[t] = e;
var G = (l, t, e) => J(l, typeof t != "symbol" ? t + "" : t, e);
import { app as U, BrowserWindow as j, ipcMain as Q } from "electron";
import L from "node:path";
import { fileURLToPath as z } from "node:url";
import { createRequire as Z } from "node:module";
import ee from "better-sqlite3";
import v from "node:fs";
let M = null;
function te(l) {
  if (M) return M;
  const t = l || "fyn-finance.sqlite";
  return M = new ee(t, {
    verbose: console.log
  }), M.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `), M;
}
function re(l) {
  l.exec(`
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
class ne {
  constructor(t) {
    this.db = t;
  }
  getProfile() {
    const t = this.db.prepare("SELECT * FROM profiles LIMIT 1").get();
    return t ? {
      id: t.id,
      name: t.name,
      email: t.email,
      currency: t.currency,
      theme: t.theme,
      onboardingDone: !!t.onboarding_done
    } : null;
  }
  createProfile(t) {
    const e = t.id || `usr_${Math.random().toString(36).substring(2, 11)}`, r = t.name || "Usuario", a = t.email || "", i = t.currency || "MXN", g = t.theme || "dark", h = t.onboardingDone ? 1 : 0;
    return this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO profiles (id, name, email, currency, theme, onboarding_done)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(e, r, a, i, g, h), this.db.prepare(`
        INSERT INTO alert_settings (
          user_id, presupuesto_alerta, presupuesto_excedido, 
          pago_proximo, pago_vencido, meta_lograda, 
          saldo_bajo, gasto_inusual, racha_ahorro, resumen_semanal
        ) VALUES (?, 1, 1, 1, 1, 1, 1, 0, 1, 0)
      `).run(e);
    })(), e;
  }
  updateProfile(t) {
    if (!t.id) return;
    const e = [], r = [];
    if (t.name && (e.push("name = ?"), r.push(t.name)), t.email && (e.push("email = ?"), r.push(t.email)), t.currency && (e.push("currency = ?"), r.push(t.currency)), t.theme && (e.push("theme = ?"), r.push(t.theme)), t.onboardingDone !== void 0 && (e.push("onboarding_done = ?"), r.push(t.onboardingDone ? 1 : 0)), e.length === 0) return;
    r.push(t.id);
    const a = `UPDATE profiles SET ${e.join(", ")} WHERE id = ?`;
    this.db.prepare(a).run(...r);
  }
  getAlertSettings(t) {
    const e = this.db.prepare("SELECT * FROM alert_settings WHERE user_id = ?").get(t);
    return e ? {
      presupuestoAlerta: !!e.presupuesto_alerta,
      presupuestoExcedido: !!e.presupuesto_excedido,
      pagoProximo: !!e.pago_proximo,
      pagoVencido: !!e.pago_vencido,
      metaLograda: !!e.meta_lograda,
      saldoBajo: !!e.saldo_bajo,
      gastoInusual: !!e.gasto_inusual,
      rachaAhorro: !!e.racha_ahorro,
      resumenSemanal: !!e.resumen_semanal
    } : null;
  }
  updateAlertSettings(t, e) {
    const r = [], a = [], i = {
      presupuestoAlerta: "presupuesto_alerta",
      presupuestoExcedido: "presupuesto_excedido",
      pagoProximo: "pago_proximo",
      pagoVencido: "pago_vencido",
      metaLograda: "meta_lograda",
      saldoBajo: "saldo_bajo",
      gastoInusual: "gasto_inusual",
      rachaAhorro: "racha_ahorro",
      resumenSemanal: "resumen_semanal"
    };
    for (const h of Object.keys(i))
      e[h] !== void 0 && (r.push(`${i[h]} = ?`), a.push(e[h] ? 1 : 0));
    if (r.length === 0) return;
    a.push(t);
    const g = `UPDATE alert_settings SET ${r.join(", ")} WHERE user_id = ?`;
    this.db.prepare(g).run(...a);
  }
}
class ae {
  constructor(t) {
    this.db = t;
  }
  getAll(t) {
    return this.db.prepare("SELECT * FROM accounts WHERE user_id = ?").all(t).map((r) => ({
      id: r.id,
      name: r.name,
      bank: r.bank,
      type: r.type,
      balance: r.balance,
      creditLimit: r.credit_limit,
      currency: r.currency,
      color: r.color,
      lastFour: r.last_four,
      isActive: !!r.is_active
    }));
  }
  create(t, e) {
    const r = e.id || void 0;
    return this.db.prepare(`
      INSERT INTO accounts (id, user_id, name, bank, type, balance, credit_limit, currency, color, last_four, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).get(
      r,
      t,
      e.name,
      e.bank,
      e.type,
      e.balance || 0,
      e.creditLimit || null,
      e.currency || "MXN",
      e.color || "#2563EB",
      e.lastFour || null,
      e.isActive !== !1 ? 1 : 0
    ).id;
  }
  update(t, e) {
    const r = [], a = [];
    if (e.name && (r.push("name = ?"), a.push(e.name)), e.bank && (r.push("bank = ?"), a.push(e.bank)), e.type && (r.push("type = ?"), a.push(e.type)), e.balance !== void 0 && (r.push("balance = ?"), a.push(e.balance)), e.creditLimit !== void 0 && (r.push("credit_limit = ?"), a.push(e.creditLimit)), e.currency && (r.push("currency = ?"), a.push(e.currency)), e.color && (r.push("color = ?"), a.push(e.color)), e.lastFour && (r.push("last_four = ?"), a.push(e.lastFour)), e.isActive !== void 0 && (r.push("is_active = ?"), a.push(e.isActive ? 1 : 0)), r.length === 0) return;
    a.push(t);
    const i = `UPDATE accounts SET ${r.join(", ")} WHERE id = ?`;
    this.db.prepare(i).run(...a);
  }
  delete(t) {
    this.db.prepare("DELETE FROM accounts WHERE id = ?").run(t);
  }
}
class oe {
  constructor(t) {
    this.db = t;
  }
  getAll(t) {
    return this.db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC
    `).all(t).map((r) => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      type: r.type,
      category: r.category,
      description: r.description,
      accountId: r.account_id,
      source: r.source,
      isRecurring: !!r.is_recurring,
      recurrencePeriod: r.recurrence_period,
      tags: JSON.parse(r.tags || "[]"),
      notes: r.notes
    }));
  }
  create(t, e) {
    const r = e.id || void 0;
    return this.db.prepare(`
      INSERT INTO transactions (id, user_id, account_id, date, amount, type, category, description, source, is_recurring, recurrence_period, tags, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).get(
      r,
      t,
      e.accountId,
      e.date,
      e.amount,
      e.type,
      e.category,
      e.description || "",
      e.source || "manual",
      e.isRecurring ? 1 : 0,
      e.recurrencePeriod || null,
      JSON.stringify(e.tags || []),
      e.notes || null
    ).id;
  }
  delete(t) {
    this.db.prepare("DELETE FROM transactions WHERE id = ?").run(t);
  }
}
class se {
  constructor(t) {
    this.db = t;
  }
  getAll(t, e) {
    return this.db.prepare("SELECT * FROM budgets WHERE user_id = ? AND period = ?").all(t, e).map((a) => ({
      id: a.id,
      category: a.category,
      monthlyLimit: a.monthly_limit,
      period: a.period,
      spent: 0
      // In a real app we'd calculate this from transactions
    }));
  }
  create(t, e) {
    const r = e.id || void 0;
    return this.db.prepare(`
      INSERT INTO budgets (id, user_id, category, monthly_limit, period)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `).get(r, t, e.category, e.monthlyLimit, e.period).id;
  }
  update(t, e) {
    const r = [], a = [];
    if (e.category && (r.push("category = ?"), a.push(e.category)), e.monthlyLimit !== void 0 && (r.push("monthly_limit = ?"), a.push(e.monthlyLimit)), e.period && (r.push("period = ?"), a.push(e.period)), r.length === 0) return;
    a.push(t);
    const i = `UPDATE budgets SET ${r.join(", ")} WHERE id = ?`;
    this.db.prepare(i).run(...a);
  }
  delete(t) {
    this.db.prepare("DELETE FROM budgets WHERE id = ?").run(t);
  }
}
class ie {
  constructor(t) {
    this.db = t;
  }
  getAll(t) {
    return this.db.prepare("SELECT * FROM saving_goals WHERE user_id = ?").all(t).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      targetAmount: r.target_amount,
      currentAmount: r.current_amount,
      targetDate: r.target_date,
      monthlyContribution: r.monthly_contribution,
      expectedReturn: r.expected_return,
      color: r.color,
      icon: r.icon
    }));
  }
  create(t, e) {
    const r = e.id || void 0;
    return this.db.prepare(`
      INSERT INTO saving_goals (id, user_id, name, type, target_amount, current_amount, target_date, monthly_contribution, expected_return, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).get(
      r,
      t,
      e.name,
      e.type,
      e.targetAmount,
      e.currentAmount || 0,
      e.targetDate,
      e.monthlyContribution || 0,
      e.expectedReturn || 0.07,
      e.color || "#2563EB",
      e.icon || "savings"
    ).id;
  }
  update(t, e) {
    const r = [], a = [];
    if (e.name && (r.push("name = ?"), a.push(e.name)), e.type && (r.push("type = ?"), a.push(e.type)), e.targetAmount !== void 0 && (r.push("target_amount = ?"), a.push(e.targetAmount)), e.currentAmount !== void 0 && (r.push("current_amount = ?"), a.push(e.currentAmount)), e.targetDate && (r.push("target_date = ?"), a.push(e.targetDate)), e.monthlyContribution !== void 0 && (r.push("monthly_contribution = ?"), a.push(e.monthlyContribution)), e.expectedReturn !== void 0 && (r.push("expected_return = ?"), a.push(e.expectedReturn)), e.color && (r.push("color = ?"), a.push(e.color)), e.icon && (r.push("icon = ?"), a.push(e.icon)), r.length === 0) return;
    a.push(t);
    const i = `UPDATE saving_goals SET ${r.join(", ")} WHERE id = ?`;
    this.db.prepare(i).run(...a);
  }
  delete(t) {
    this.db.prepare("DELETE FROM saving_goals WHERE id = ?").run(t);
  }
}
class ce {
  constructor(t) {
    this.db = t;
  }
  getAll(t) {
    return this.db.prepare("SELECT * FROM debts WHERE user_id = ?").all(t).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      balance: r.balance,
      originalBalance: r.original_balance,
      interestRate: r.interest_rate,
      minimumPayment: r.minimum_payment,
      dueDay: r.due_day,
      accountId: r.account_id
    }));
  }
  create(t, e) {
    const r = e.id || void 0;
    return this.db.prepare(`
      INSERT INTO debts (id, user_id, name, type, balance, original_balance, interest_rate, minimum_payment, due_day, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).get(
      r,
      t,
      e.name,
      e.type,
      e.balance,
      e.originalBalance,
      e.interestRate,
      e.minimumPayment,
      e.dueDay,
      e.accountId || null
    ).id;
  }
  delete(t) {
    this.db.prepare("DELETE FROM debts WHERE id = ?").run(t);
  }
}
class le {
  constructor(t) {
    this.db = t;
  }
  getAll(t) {
    return this.db.prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC").all(t).map((r) => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      title: r.title,
      message: r.message,
      date: r.created_at,
      isRead: !!r.is_read
    }));
  }
  markAsRead(t) {
    this.db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ?").run(t);
  }
  markAllAsRead(t) {
    this.db.prepare("UPDATE alerts SET is_read = 1 WHERE user_id = ?").run(t);
  }
  create(t, e) {
    this.db.prepare(`
      INSERT INTO alerts (id, user_id, type, severity, title, message, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      e.id || void 0,
      t,
      e.type,
      e.severity,
      e.title,
      e.message,
      e.isRead ? 1 : 0
    );
  }
}
class X {
  static getLogPaths() {
    if (!this.logFilePathUserData)
      try {
        const t = U.getPath("userData");
        this.logFilePathUserData = L.join(t, "errores.log");
      } catch {
        this.logFilePathUserData = L.join(process.cwd(), "errores-fallback.log");
      }
    return this.logFilePathWorkspace || (this.logFilePathWorkspace = L.join(process.cwd(), "errores.log")), {
      userDataPath: this.logFilePathUserData,
      workspacePath: this.logFilePathWorkspace
    };
  }
  /**
   * Genera un ID de error único y legible con formato ERR-FYN-YYYYMMDD-XXXX
   */
  static generateErrorId() {
    const e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, ""), r = Math.random().toString(16).substring(2, 8).toUpperCase();
    return `ERR-FYN-${e}-${r}`;
  }
  /**
   * Registra un error con su stack trace en los archivos locales errores.log
   * Retorna el ID de error único generado.
   */
  static logError(t, e = "GLOBAL") {
    const r = this.generateErrorId(), a = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 23);
    let i = "", g = "", h = "Error";
    t instanceof Error ? (i = t.message, g = t.stack || "No stack trace available", h = t.name || "Error") : typeof t == "object" && t !== null ? (i = t.message || JSON.stringify(t), g = t.stack || "No stack trace available (Object thrown)", h = t.name || t.code || "ObjectError") : (i = String(t), g = new Error().stack || "No stack trace generated", h = "PrimitiveError");
    const S = `
=========================================
[${a}] REFERENCE ID: ${r}
CONTEXT: ${e}
TYPE: ${h}
MESSAGE: ${i}
-----------------------------------------
STACK TRACE:
${g}
=========================================
`;
    console.error(`[LOGGER ERROR - ${r}] Context: ${e} | Message: ${i}`);
    const { userDataPath: s, workspacePath: o } = this.getLogPaths();
    return v.appendFile(s, S, "utf8", (n) => {
      n && console.error("[LOGGER] Error al escribir log en userData:", n);
    }), v.appendFile(o, S, "utf8", (n) => {
      n && console.error("[LOGGER] Error al escribir log en workspace:", n);
    }), r;
  }
  /**
   * Registra un mensaje informativo general en el log
   */
  static logInfo(t, e = "INFO") {
    const a = `[${(/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 23)}] [${e}] ${t}
`;
    console.log(`[LOGGER INFO] [${e}] ${t}`);
    const { userDataPath: i, workspacePath: g } = this.getLogPaths();
    v.appendFile(i, a, "utf8", () => {
    }), v.appendFile(g, a, "utf8", () => {
    });
  }
}
G(X, "logFilePathUserData", null), G(X, "logFilePathWorkspace", null);
process.on("uncaughtException", (l) => {
  X.logError(l, "MAIN_UNCAUGHT");
});
process.on("unhandledRejection", (l) => {
  X.logError(l, "MAIN_UNHANDLED_REJECTION");
});
const W = Z(import.meta.url), Y = L.dirname(z(import.meta.url));
U.disableHardwareAcceleration();
process.env.APP_ROOT = L.join(Y, "..");
const B = process.env.VITE_DEV_SERVER_URL, Re = L.join(process.env.APP_ROOT, "dist-electron"), $ = L.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = B ? L.join(process.env.APP_ROOT, "public") : $;
let R = null;
function V() {
  R = new j({
    width: 1400,
    height: 1e3,
    icon: L.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: L.join(Y, "preload.js")
    },
    title: "Fyn Finance OS",
    backgroundColor: "#0e0e0f",
    show: !1
  });
  const l = console.log, t = console.error, e = (r, a) => {
    R != null && R.webContents && (l(`[Internal ${r}]`, a), R.webContents.send("system:log", {
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: r,
      message: typeof a == "object" ? JSON.stringify(a, null, 2) : String(a)
    }));
  };
  console.log = (...r) => {
    l(...r), e("INFO", r.join(" "));
  }, console.error = (...r) => {
    t(...r), e("ERROR", r.join(" "));
  }, R.once("ready-to-show", () => {
    R == null || R.show();
  }), B ? (console.log("[Main] Loading URL:", B), R.loadURL(B)) : (console.log("[Main] Loading File:", L.join($, "index.html")), R.loadFile(L.join($, "index.html"))), R.webContents.on("did-fail-load", (r, a, i) => {
    console.error(`[Main] Failed to load: ${a} - ${i}`);
  });
}
U.on("window-all-closed", () => {
  process.platform !== "darwin" && (U.quit(), R = null);
});
U.on("activate", () => {
  j.getAllWindows().length === 0 && V();
});
U.whenReady().then(() => {
  const l = L.join(U.getPath("userData"), "fyn-finance.sqlite"), t = te(l);
  re(t);
  const e = new ne(t), r = new ae(t), a = new oe(t), i = new se(t), g = new ie(t), h = new ce(t), S = new le(t);
  function s(o, n) {
    Q.handle(o, async (c, ...N) => {
      try {
        return await n(c, ...N);
      } catch (T) {
        return {
          isError: !0,
          message: "Ocurrió un error inesperado al procesar la solicitud.",
          ref: X.logError(T, `IPC:${o}`)
        };
      }
    });
  }
  s("get-profile", () => e.getProfile()), s("create-profile", (o, n) => e.createProfile(n)), s("update-profile", (o, n) => e.updateProfile(n)), s("get-alert-settings", (o, n) => e.getAlertSettings(n)), s("update-alert-settings", (o, n, c) => e.updateAlertSettings(n, c)), s("get-net-worth-history", (o, n) => t.prepare("SELECT month, assets, liabilities, net_worth as netWorth FROM net_worth_history WHERE user_id = ? ORDER BY month ASC").all(n)), s("calculate-net-worth-history", (o, n) => {
    const c = t.prepare("SELECT type, balance FROM accounts WHERE user_id = ?").all(n);
    let N = 0, T = 0;
    for (const d of c)
      d.type === "credito" ? d.balance < 0 ? T += Math.abs(d.balance) : T += d.balance : d.balance > 0 && (N += d.balance);
    const b = t.prepare("SELECT date, amount, type FROM transactions WHERE user_id = ? ORDER BY date DESC").all(n), _ = {};
    for (const d of b) {
      const O = d.date.substring(0, 7);
      _[O] || (_[O] = []), _[O].push(d);
    }
    const u = /* @__PURE__ */ new Date(), f = [];
    for (let d = 5; d >= 0; d--) {
      const y = new Date(u.getFullYear(), u.getMonth() - d, 1).toISOString().substring(0, 7);
      f.push(y);
    }
    const D = [...f].reverse(), m = [];
    let p = N, I = T;
    for (const d of D) {
      m.push({
        month: d,
        assets: Math.round(p),
        liabilities: Math.round(I),
        netWorth: Math.round(p - I)
      });
      const O = _[d] || [];
      for (const y of O)
        y.type === "ingreso" ? p -= y.amount : y.type === "gasto" && (p += y.amount);
    }
    const C = m.reverse(), P = t.prepare(`
      INSERT INTO net_worth_history (user_id, month, assets, liabilities, net_worth)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, month) DO UPDATE SET
        assets = excluded.assets,
        liabilities = excluded.liabilities,
        net_worth = excluded.net_worth
    `);
    return t.transaction(() => {
      for (const d of C)
        P.run(n, d.month, d.assets, d.liabilities, d.netWorth);
    })(), C;
  }), s("get-accounts", (o, n) => r.getAll(n)), s("add-account", (o, n, c) => r.create(n, c)), s("update-account", (o, n, c) => r.update(n, c)), s("delete-account", (o, n) => r.delete(n)), s("get-transactions", (o, n) => a.getAll(n)), s("add-transaction", (o, n, c) => a.create(n, c)), s("delete-transaction", (o, n) => a.delete(n)), s("get-budgets", (o, n, c) => i.getAll(n, c)), s("add-budget", (o, n, c) => i.create(n, c)), s("update-budget", (o, n, c) => i.update(n, c)), s("delete-budget", (o, n) => i.delete(n)), s("get-goals", (o, n) => g.getAll(n)), s("add-goal", (o, n, c) => g.create(n, c)), s("update-goal", (o, n, c) => g.update(n, c)), s("delete-goal", (o, n) => g.delete(n)), s("get-debts", (o, n) => h.getAll(n)), s("add-debt", (o, n, c) => h.create(n, c)), s("delete-debt", (o, n) => h.delete(n)), s("get-alerts", (o, n) => S.getAll(n)), s("mark-alert-read", (o, n) => S.markAsRead(n)), s("mark-all-alerts-read", (o, n) => S.markAllAsRead(n)), s("reset-database", async () => (console.log("[Main] Resetting database..."), t.prepare("DELETE FROM alerts").run(), t.prepare("DELETE FROM transactions").run(), t.prepare("DELETE FROM accounts").run(), t.prepare("DELETE FROM saving_goals").run(), t.prepare("DELETE FROM budgets").run(), t.prepare("DELETE FROM debts").run(), t.prepare("DELETE FROM net_worth_history").run(), t.prepare("DELETE FROM profiles").run(), !0)), s("system:log-renderer-error", (o, n) => {
    const { message: c, stack: N, url: T, line: b, col: _ } = n || {}, u = {
      name: "RendererError",
      message: c || "Unknown React/Renderer error",
      stack: N || `at ${T || "unknown"}:${b || 0}:${_ || 0}`
    };
    return X.logError(u, "RENDERER");
  }), s("parse-pdf", async (o, n) => {
    const { detectBank: c, parsePdfContent: N } = await import("./index-BRKsNUSA.js"), T = W("pdf-parse");
    console.log("[Main] pdf-parse loaded for parse-pdf preview. Type:", typeof T);
    const b = await import("node:fs");
    console.log("[Main] Starting parse-pdf preview for:", n);
    const _ = b.readFileSync(n);
    let u = "";
    if (T && T.PDFParse) {
      console.log("[Main] Instantiating PDFParse for preview with data buffer...");
      const m = new T.PDFParse({ data: _ });
      u = (await m.getText()).text, await m.destroy();
    } else {
      const m = typeof T == "function" ? T : T.default;
      if (typeof m != "function")
        throw new Error(`pdf-parse is not a function (it is a ${typeof m})`);
      u = (await m(_)).text;
    }
    console.log(`[Main] PDF Text extracted for preview. Length: ${u.length} chars.`);
    const f = c(u);
    if (console.log(`[Main] Bank detected for preview: ${f}`), f === "Generic")
      return { success: !1, error: "Banco no reconocido automáticamente. Asegúrate de que el PDF sea un estado de cuenta original." };
    const D = N(f, u);
    return console.log(`[Main] Transactions parsed for preview: ${D.length}`), D.length === 0 ? { success: !1, error: `No se encontraron transacciones legibles para ${f}.` } : {
      success: !0,
      bank: f,
      transactions: D
    };
  }), s("pdf:parseAndSave", async (o, n) => {
    const { detectBank: c, parsePdfContent: N } = await import("./index-BRKsNUSA.js"), { extractAccountMeta: T } = await import("./metaExtractor-3aSMOwGp.js"), { inferCategory: b, generateTxHash: _ } = await import("./categoryInfer-MHdCU11W.js"), u = W("pdf-parse");
    console.log("[Main] pdf-parse loaded. Type:", typeof u);
    const f = await import("node:fs");
    console.log("[Main] Starting PDF parse for:", n);
    const D = f.readFileSync(n);
    let m = "";
    if (u && u.PDFParse) {
      console.log("[Main] Instantiating PDFParse with data buffer...");
      const A = new u.PDFParse({ data: D });
      m = (await A.getText()).text, await A.destroy();
    } else {
      const A = typeof u == "function" ? u : u.default;
      if (typeof A != "function")
        throw new Error(`pdf-parse is not a function (it is a ${typeof A})`);
      m = (await A(D)).text;
    }
    console.log(`[Main] PDF Text extracted. Length: ${m.length} chars.`);
    const p = c(m);
    if (console.log(`[Main] Bank detected: ${p}`), p === "Generic")
      return { success: !1, error: "Banco no reconocido automáticamente. Asegúrate de que el PDF sea un estado de cuenta original." };
    const I = T(m, p), C = Array.isArray(I) ? I : [I], P = t.prepare("SELECT id FROM profiles LIMIT 1").get();
    if (!P) return { success: !1, error: "No hay perfil configurado." };
    const w = N(p, m);
    if (console.log(`[Main] Transactions parsed: ${w.length}`), w.length === 0 && C.length === 0)
      return { success: !1, error: `No se encontraron datos legibles para ${p}.` };
    const d = t.prepare(`
      INSERT INTO accounts (user_id, name, bank, type, balance, currency, color, last_four)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, type
    `), O = t.prepare(`
      INSERT OR IGNORE INTO transactions 
      (user_id, account_id, date, amount, type, category, description, source, dedup_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    let y = 0, H = 0;
    const x = {};
    return t.transaction((A) => {
      for (const E of C) {
        let F = t.prepare(`
          SELECT * FROM accounts 
          WHERE user_id = ? AND bank = ? AND (last_four = ? OR name = ?)
        `).get(P.id, p, E.lastFour, E.accountName);
        if (!F) {
          console.log("[Main] Creating new account:", E.accountName);
          const k = p === "Openbank" ? "#0066CC" : p === "BBVA" ? "#004481" : p === "Klar" ? "#00C4B3" : "#820AD1";
          F = { id: d.get(
            P.id,
            E.accountName,
            p,
            E.accountType,
            E.finalBalance || 0,
            E.currency,
            k,
            E.lastFour
          ).id, name: E.accountName, type: E.accountType };
        }
        x[E.accountType] = F, E.finalBalance !== void 0 && t.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(E.finalBalance, F.id);
      }
      for (const E of A) {
        let F = x[E.subAccount || "debito"] || Object.values(x)[0];
        if (!F) continue;
        const k = _(E.date, E.amount, E.description);
        O.run(
          P.id,
          F.id,
          E.date,
          E.amount,
          E.type,
          b(E.description, E.type),
          E.description,
          "pdf",
          k
        ).changes > 0 ? y++ : H++;
      }
    })(w), {
      success: !0,
      bank: p,
      accountName: C.map((A) => A.accountName).join(" + "),
      inserted: y,
      duplicates: H
    };
  }), s("show-open-dialog", async () => {
    const { dialog: o } = await import("electron");
    return (await o.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Documentos PDF", extensions: ["pdf"] }]
    })).filePaths[0];
  }), console.log("Database initialized at:", l), V();
});
export {
  Re as MAIN_DIST,
  $ as RENDERER_DIST,
  B as VITE_DEV_SERVER_URL
};
//# sourceMappingURL=main.js.map
