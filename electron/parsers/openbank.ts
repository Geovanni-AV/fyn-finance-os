import type { ParsedTransaction } from '../../src/types/parsers'

/**
 * Parser para estados de cuenta Openbank México
 * Formato: DD/MM/YYYY con columnas Depósito / Retiro / Saldo
 * Cubre: Cuenta Débito Open+ y Apartado Open (en el mismo PDF)
 */

const INTERNAL_PATTERNS = [
  /Retiro a Apartado Open/i,
  /Abono desde Apartado Open/i,
  /Abono de intereses/i,
  /Abono desde Cuenta Débito Open/i,
  /Retiro a Cuenta Débito Open/i,
]

function isInternal(description: string): boolean {
  return INTERNAL_PATTERNS.some(p => p.test(description))
}

function parseDate(raw: string): string {
  const parts = raw.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts
  const fullYear = year.length === 2 ? `20${year}` : year
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[$,\s]/g, '')) || 0
}

export function parseOpenbank(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Detectar línea que empieza con fecha DD/MM/YY(YY)
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{2,4})(.*)/)
    if (!dateMatch) { i++; continue }

    const dateStr = parseDate(dateMatch[1])
    if (!dateStr) { i++; continue }

    let description = dateMatch[2].trim()

    // Si la descripción está vacía o es muy corta, tomar la siguiente línea
    if (description.length < 3 && lines[i + 1] && !lines[i + 1].match(/^\d{2}\/\d{2}\/\d{2,4}/)) {
      description = lines[i + 1].trim()
      i++
    }

    // Buscar montos en la misma línea o en las siguientes 2
    let amountLine = line
    if (!amountLine.match(/\$\s*[\d,]+\.\d{2}/)) {
      amountLine = (lines[i + 1] || '') + ' ' + (lines[i + 2] || '')
    }

    const amounts = [...amountLine.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map(m => parseAmount(m[1]))

    if (amounts.length < 2) { i++; continue }

    const movimiento = amounts[amounts.length - 2]

    if (movimiento <= 0) { i++; continue }
    if (isInternal(description)) { i++; continue }

    let type: 'ingreso' | 'gasto'
    if (amounts.length >= 3) {
      const deposit = amounts[0]
      const withdrawal = amounts[1]
      type = deposit > 0 && withdrawal === 0 ? 'ingreso' : 'gasto'
    } else {
      const isDeposit = /recib|abono|depósit|SPEI recib/i.test(description)
      type = isDeposit ? 'ingreso' : 'gasto'
    }

    const cleanDesc = description
      .replace(/\d{15,}/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    transactions.push({
      date: dateStr,
      amount: movimiento,
      type,
      description: cleanDesc || 'Transferencia Openbank',
    })

    i++
  }

  return transactions
}
