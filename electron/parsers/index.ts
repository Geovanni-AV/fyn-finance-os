import { parseOpenbank } from './openbank'
import { parseKlar } from './klar'
import type { ParsedTransaction } from '../../src/types/parsers'

export function detectBank(text: string): string {
  if (/Openbank/i.test(text)) return 'Openbank'
  if (/BBVA/i.test(text)) return 'BBVA'
  if (/\bNu\b/i.test(text) || /Nu México/i.test(text)) return 'Nu'
  if (/Klar/i.test(text) || /Klar Technologies/i.test(text)) return 'Klar'
  return 'Generic'
}

export function parsePdfContent(bank: string, text: string): ParsedTransaction[] {
  switch (bank) {
    case 'Openbank':
      return parseOpenbank(text)
    case 'BBVA':
      return parseBBVA(text)
    case 'Nu':
      return parseNu(text)
    case 'Klar':
      return parseKlar(text)
    default:
      return []
  }
}

function parseBBVA(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  const regex = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, description, withdrawal, deposit] = match
    const amount = withdrawal ? parseFloat(withdrawal.replace(/,/g, '')) : parseFloat(deposit!.replace(/,/g, ''))
    const type = withdrawal ? 'gasto' : 'ingreso'

    const [day, month, year] = dateStr.split('/')
    const date = `${year}-${month}-${day}`

    transactions.push({
      date,
      description: description.trim(),
      amount,
      type
    })
  }
  return transactions
}

function parseNu(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  
  // Format: 05 ENE 2026 Carlos Geovanni Andrade Valverde Transferencia -$413.00
  // Or: 05 ENE 2026 Pago a tu tarjeta de crédito Nu -$17.00
  const regex = /(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(.+?)\s+([+-]\$[\d,]+\.\d{2})/gi
  let match

  const MONTH_MAP: Record<string, string> = {
    ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
    JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12'
  }

  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, description, amountStr] = match
    
    // Parse Spanish date
    const dateParts = dateStr.trim().split(/\s+/)
    let date = ''
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0')
      const monthAbbr = dateParts[1].toUpperCase()
      const year = dateParts[2]
      const month = MONTH_MAP[monthAbbr] || '01'
      date = `${year}-${month}-${day}`
    } else {
      continue
    }

    // Clean amount (remove +/$, then parse float)
    const rawAmountStr = amountStr.replace(/[+$]/g, '').replace(/,/g, '')
    const rawAmount = parseFloat(rawAmountStr)
    const amount = Math.abs(rawAmount)
    const type = rawAmount < 0 ? 'gasto' : 'ingreso'

    transactions.push({
      date,
      description: description.trim(),
      amount,
      type
    })
  }
  return transactions
}
