import { parseOpenbank } from './openbank'
import type { ParsedTransaction } from '../../src/types/parsers'

export function detectBank(text: string): string {
  if (/Openbank/i.test(text)) return 'Openbank'
  if (/BBVA/i.test(text)) return 'BBVA'
  if (/Nu/i.test(text) || /Nu México/i.test(text)) return 'Nu'
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
  const regex = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const [_, date, description, amountStr] = match
    const rawAmount = parseFloat(amountStr.replace(/,/g, ''))
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
