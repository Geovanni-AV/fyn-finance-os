import type { Database } from 'better-sqlite3'
import type { Account } from '../../types'

export class AccountRepository {
  constructor(private db: Database) {}

  getAll(userId: string): Account[] {
    const rows = this.db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(userId) as any[]
    return rows.map(row => ({
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
    }))
  }

  create(userId: string, account: Partial<Account>): string {
    const id = account.id || undefined
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, user_id, name, bank, type, balance, credit_limit, currency, color, last_four, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `)

    const result = stmt.get(
      id,
      userId,
      account.name,
      account.bank,
      account.type,
      account.balance || 0,
      account.creditLimit || null,
      account.currency || 'MXN',
      account.color || '#2563EB',
      account.lastFour || null,
      account.isActive !== false ? 1 : 0
    ) as { id: string }
    
    return result.id
  }

  update(id: string, updates: Partial<Account>): void {
    const fields: string[] = []
    const params: any[] = []

    if (updates.name) { fields.push('name = ?'); params.push(updates.name) }
    if (updates.bank) { fields.push('bank = ?'); params.push(updates.bank) }
    if (updates.type) { fields.push('type = ?'); params.push(updates.type) }
    if (updates.balance !== undefined) { fields.push('balance = ?'); params.push(updates.balance) }
    if (updates.creditLimit !== undefined) { fields.push('credit_limit = ?'); params.push(updates.creditLimit) }
    if (updates.currency) { fields.push('currency = ?'); params.push(updates.currency) }
    if (updates.color) { fields.push('color = ?'); params.push(updates.color) }
    if (updates.lastFour) { fields.push('last_four = ?'); params.push(updates.lastFour) }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); params.push(updates.isActive ? 1 : 0) }

    if (fields.length === 0) return

    params.push(id)
    const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`
    this.db.prepare(sql).run(...params)
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
  }
}
