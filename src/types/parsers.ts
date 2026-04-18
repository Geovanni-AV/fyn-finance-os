export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'ingreso' | 'gasto'
  category?: string
}

export interface ParseResult {
  success: boolean
  bank: string
  count: number
  transactions: ParsedTransaction[]
  error?: string
}
