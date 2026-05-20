export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'ingreso' | 'gasto'
  category?: string
  subAccount?: string // Identifica a qué cuenta pertenece (Ej. 'inversion', 'credito', 'principal')
}

export interface ParsedDebt {
  name: string
  type: string
  balance: number
  originalBalance: number
  interestRate: number
  minimumPayment: number
  dueDay: number
  subAccount?: string
}

export interface ParseResult {
  success: boolean
  bank: string
  count: number
  transactions: ParsedTransaction[]
  debts?: ParsedDebt[]
  error?: string
}
