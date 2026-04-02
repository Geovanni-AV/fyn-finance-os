import fs from 'fs'
import pdf from 'pdf-parse'
import { supabase } from './supabase.js'

interface Transaction {
  date: string
  description: string
  amount: number
  type: 'ingreso' | 'gasto'
  category?: string
  account_id: string
  user_id: string
}

export async function processPdf(filePath: string, bankId: string, accountId: string, userId: string) {
  const dataBuffer = fs.readFileSync(filePath)
  const data = await pdf(dataBuffer)
  const text = data.text

  let transactions: Transaction[] = []
  let confidence = 0

  if (bankId === 'bbva') {
    transactions = parseBBVA(text, accountId, userId)
  } else if (bankId === 'nu') {
    transactions = parseNu(text, accountId, userId)
  } else {
    // Fallback or generic parser
    transactions = parseGeneric(text, accountId, userId)
  }

  // Return transactions for review instead of auto-inserting
  return { success: true, count: transactions.length, transactions }
}

function parseBBVA(text: string, accountId: string, userId: string): Transaction[] {
  const transactions: Transaction[] = []
  // DATE | DESCRIPTION | WITHDRAWAL | DEPOSIT | BALANCE
  // Regex from references/parsers.md
  const regex = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, description, withdrawal, deposit] = match
    const amount = withdrawal ? parseFloat(withdrawal.replace(/,/g, '')) : parseFloat(deposit!.replace(/,/g, ''))
    const type = withdrawal ? 'gasto' : 'ingreso'

    // Convert date DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('/')
    const date = `${year}-${month}-${day}`

    transactions.push({
      date,
      description: description.trim(),
      amount,
      type,
      account_id: accountId,
      user_id: userId
    })
  }
  return transactions
}

function parseNu(text: string, accountId: string, userId: string): Transaction[] {
  const transactions: Transaction[] = []
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
      type,
      account_id: accountId,
      user_id: userId
    })
  }
  return transactions
}

function parseGeneric(text: string, accountId: string, userId: string): Transaction[] {
  // Very basic generic parser for common patterns
  return []
}
