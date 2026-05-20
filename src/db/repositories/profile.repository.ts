import type { Database } from 'better-sqlite3'
import type { UserProfile, AlertSettings } from '../../types'

export class ProfileRepository {
  constructor(private db: Database) {}

  getProfile(): (UserProfile & { id: string; onboardingDone: boolean }) | null {
    const row = this.db.prepare('SELECT * FROM profiles LIMIT 1').get() as any
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      currency: row.currency as 'MXN',
      theme: row.theme as 'dark' | 'light',
      onboardingDone: Boolean(row.onboarding_done)
    }
  }

  createProfile(profile: Partial<UserProfile & { id: string; onboardingDone: boolean }>): string {
    // Generar un ID si no se proporciona
    const id = profile.id || `usr_${Math.random().toString(36).substring(2, 11)}`
    const name = profile.name || 'Usuario'
    const email = profile.email || ''
    const currency = profile.currency || 'MXN'
    const theme = profile.theme || 'dark'
    const onboardingDone = profile.onboardingDone ? 1 : 0

    // Usar transacción para insertar el perfil y sus settings por defecto
    const runTx = this.db.transaction(() => {
      const stmtProfile = this.db.prepare(`
        INSERT INTO profiles (id, name, email, currency, theme, onboarding_done)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      stmtProfile.run(id, name, email, currency, theme, onboardingDone)

      const stmtSettings = this.db.prepare(`
        INSERT INTO alert_settings (
          user_id, presupuesto_alerta, presupuesto_excedido, 
          pago_proximo, pago_vencido, meta_lograda, 
          saldo_bajo, gasto_inusual, racha_ahorro, resumen_semanal
        ) VALUES (?, 1, 1, 1, 1, 1, 1, 0, 1, 0)
      `)
      stmtSettings.run(id)
    })

    runTx()
    return id
  }

  updateProfile(profile: Partial<UserProfile & { id: string; onboardingDone: boolean }>): void {
    if (!profile.id) return
    
    const fields: string[] = []
    const params: any[] = []

    if (profile.name) { fields.push('name = ?'); params.push(profile.name) }
    if (profile.email) { fields.push('email = ?'); params.push(profile.email) }
    if (profile.currency) { fields.push('currency = ?'); params.push(profile.currency) }
    if (profile.theme) { fields.push('theme = ?'); params.push(profile.theme) }
    if (profile.onboardingDone !== undefined) { 
      fields.push('onboarding_done = ?')
      params.push(profile.onboardingDone ? 1 : 0) 
    }

    if (fields.length === 0) return

    params.push(profile.id)
    const sql = `UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`
    this.db.prepare(sql).run(...params)
  }

  getAlertSettings(userId: string): AlertSettings | null {
    const row = this.db.prepare('SELECT * FROM alert_settings WHERE user_id = ?').get(userId) as any
    if (!row) return null

    return {
      presupuestoAlerta: Boolean(row.presupuesto_alerta),
      presupuestoExcedido: Boolean(row.presupuesto_excedido),
      pagoProximo: Boolean(row.pago_proximo),
      pagoVencido: Boolean(row.pago_vencido),
      metaLograda: Boolean(row.meta_lograda),
      saldoBajo: Boolean(row.saldo_bajo),
      gastoInusual: Boolean(row.gasto_inusual),
      rachaAhorro: Boolean(row.racha_ahorro),
      resumenSemanal: Boolean(row.resumen_semanal),
    }
  }

  updateAlertSettings(userId: string, settings: Partial<AlertSettings>): void {
    const fields: string[] = []
    const params: any[] = []

    const mapping: Record<keyof AlertSettings, string> = {
      presupuestoAlerta: 'presupuesto_alerta',
      presupuestoExcedido: 'presupuesto_excedido',
      pagoProximo: 'pago_proximo',
      pagoVencido: 'pago_vencido',
      metaLograda: 'meta_lograda',
      saldoBajo: 'saldo_bajo',
      gastoInusual: 'gasto_inusual',
      rachaAhorro: 'racha_ahorro',
      resumenSemanal: 'resumen_semanal',
    }

    for (const key of Object.keys(mapping) as Array<keyof AlertSettings>) {
      if (settings[key] !== undefined) {
        fields.push(`${mapping[key]} = ?`)
        params.push(settings[key] ? 1 : 0)
      }
    }

    if (fields.length === 0) return

    params.push(userId)
    const sql = `UPDATE alert_settings SET ${fields.join(', ')} WHERE user_id = ?`
    this.db.prepare(sql).run(...params)
  }
}

