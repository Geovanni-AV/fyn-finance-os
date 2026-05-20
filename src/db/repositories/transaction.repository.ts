import type { Database } from 'better-sqlite3'
import type { Transaction } from '../../types'

export class TransactionRepository {
  constructor(private db: Database) {}

  getAll(userId: string): Transaction[] {
    const rows = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC
    `).all(userId) as any[]
    
    return rows.map(row => ({
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
      tags: JSON.parse(row.tags || '[]'),
      notes: row.notes
    }))
  }

  create(userId: string, tx: Partial<Transaction>): string {
    const id = tx.id || undefined
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, user_id, account_id, date, amount, type, category, description, source, is_recurring, recurrence_period, tags, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `)

    const result = stmt.get(
      id,
      userId,
      tx.accountId,
      tx.date,
      tx.amount,
      tx.type,
      tx.category,
      tx.description || '',
      tx.source || 'manual',
      tx.isRecurring ? 1 : 0,
      tx.recurrencePeriod || null,
      JSON.stringify(tx.tags || []),
      tx.notes || null
    ) as { id: string }

    return result.id
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  }
}
