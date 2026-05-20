import type { Database } from 'better-sqlite3'
import type { Budget } from '../../types'

export class BudgetRepository {
  constructor(private db: Database) {}

  getAll(userId: string, period: string): Budget[] {
    const rows = this.db.prepare('SELECT * FROM budgets WHERE user_id = ? AND period = ?').all(userId, period) as any[]
    
    return rows.map(row => ({
      id: row.id,
      category: row.category,
      monthlyLimit: row.monthly_limit,
      period: row.period,
      spent: 0 // In a real app we'd calculate this from transactions
    }))
  }

  create(userId: string, budget: Partial<Budget>): string {
    const id = budget.id || undefined
    const stmt = this.db.prepare(`
      INSERT INTO budgets (id, user_id, category, monthly_limit, period)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `)
    const result = stmt.get(id, userId, budget.category, budget.monthlyLimit, budget.period) as { id: string }
    return result.id
  }

  update(id: string, updates: Partial<Budget>): void {
    const fields: string[] = []
    const params: any[] = []

    if (updates.category) { fields.push('category = ?'); params.push(updates.category) }
    if (updates.monthlyLimit !== undefined) { fields.push('monthly_limit = ?'); params.push(updates.monthlyLimit) }
    if (updates.period) { fields.push('period = ?'); params.push(updates.period) }

    if (fields.length === 0) return

    params.push(id)
    const sql = `UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`
    this.db.prepare(sql).run(...params)
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM budgets WHERE id = ?').run(id)
  }
}
