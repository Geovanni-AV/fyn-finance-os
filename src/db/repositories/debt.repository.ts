import type { Database } from 'better-sqlite3'
import type { Debt } from '../../types'

export class DebtRepository {
  constructor(private db: Database) {}

  getAll(userId: string): Debt[] {
    const rows = this.db.prepare('SELECT * FROM debts WHERE user_id = ?').all(userId) as any[]
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      balance: row.balance,
      originalBalance: row.original_balance,
      interestRate: row.interest_rate,
      minimumPayment: row.minimum_payment,
      dueDay: row.due_day,
      accountId: row.account_id
    }))
  }

  create(userId: string, debt: Partial<Debt>): string {
    const id = debt.id || undefined
    const stmt = this.db.prepare(`
      INSERT INTO debts (id, user_id, name, type, balance, original_balance, interest_rate, minimum_payment, due_day, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `)

    const result = stmt.get(
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
    ) as { id: string }

    return result.id
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM debts WHERE id = ?').run(id)
  }
}
