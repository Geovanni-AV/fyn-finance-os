import type { Database } from 'better-sqlite3'
import type { SavingGoal } from '../../types'

export class GoalRepository {
  constructor(private db: Database) {}

  getAll(userId: string): SavingGoal[] {
    const rows = this.db.prepare('SELECT * FROM saving_goals WHERE user_id = ?').all(userId) as any[]
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      targetDate: row.target_date,
      monthlyContribution: row.monthly_contribution,
      expectedReturn: row.expected_return,
      color: row.color,
      icon: row.icon
    }))
  }

  create(userId: string, goal: Partial<SavingGoal>): string {
    const id = goal.id || undefined
    const stmt = this.db.prepare(`
      INSERT INTO saving_goals (id, user_id, name, type, target_amount, current_amount, target_date, monthly_contribution, expected_return, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `)
    const result = stmt.get(
      id,
      userId,
      goal.name,
      goal.type,
      goal.targetAmount,
      goal.currentAmount || 0,
      goal.targetDate,
      goal.monthlyContribution || 0,
      goal.expectedReturn || 0.07,
      goal.color || '#2563EB',
      goal.icon || 'savings'
    ) as { id: string }
    return result.id
  }

  update(id: string, updates: Partial<SavingGoal>): void {
    const fields: string[] = []
    const params: any[] = []

    if (updates.name) { fields.push('name = ?'); params.push(updates.name) }
    if (updates.type) { fields.push('type = ?'); params.push(updates.type) }
    if (updates.targetAmount !== undefined) { fields.push('target_amount = ?'); params.push(updates.targetAmount) }
    if (updates.currentAmount !== undefined) { fields.push('current_amount = ?'); params.push(updates.currentAmount) }
    if (updates.targetDate) { fields.push('target_date = ?'); params.push(updates.targetDate) }
    if (updates.monthlyContribution !== undefined) { fields.push('monthly_contribution = ?'); params.push(updates.monthlyContribution) }
    if (updates.expectedReturn !== undefined) { fields.push('expected_return = ?'); params.push(updates.expectedReturn) }
    if (updates.color) { fields.push('color = ?'); params.push(updates.color) }
    if (updates.icon) { fields.push('icon = ?'); params.push(updates.icon) }

    if (fields.length === 0) return

    params.push(id)
    const sql = `UPDATE saving_goals SET ${fields.join(', ')} WHERE id = ?`
    this.db.prepare(sql).run(...params)
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM saving_goals WHERE id = ?').run(id)
  }
}
