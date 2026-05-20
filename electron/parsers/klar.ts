import type { ParsedTransaction } from '../../src/types/parsers'

export function parseKlar(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  
  // 1. Extraer el año del periodo
  let year = new Date().getFullYear().toString()
  const yearMatch = /(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre).*?(\d{4})/i.exec(text)
  if (yearMatch) {
    year = yearMatch[1]
  }

  // Dividir el texto en dos bloques principales para distinguir cuentas
  const parts = text.split(/Rendimientos y retenciones/i)
  const principalText = parts[0]
  const inversionesText = parts.length > 1 ? parts[1] : ''

  const regex = /(\d{2}\/\d{2})\s+(.+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/g
  
  const parseBlock = (blockText: string, subAccountType: string) => {
    let match
    while ((match = regex.exec(blockText)) !== null) {
      const [_, dateStr, descriptionRaw, cargosStr, abonosStr] = match
      const [day, month] = dateStr.split('/')
      const date = `${year}-${month}-${day}`
      const cargo = parseFloat(cargosStr.replace(/,/g, ''))
      const abono = parseFloat(abonosStr.replace(/,/g, ''))
      const description = descriptionRaw.trim()

      if (cargo === 0 && abono === 0) continue

      if (cargo > 0) {
        transactions.push({
          date,
          description,
          amount: cargo,
          type: 'gasto',
          subAccount: subAccountType
        })
      }
      
      if (abono > 0) {
        const descPostfix = (cargo > 0 && abono > 0) ? ' (Abono)' : ''
        transactions.push({
          date,
          description: `${description}${descPostfix}`,
          amount: abono,
          type: 'ingreso',
          subAccount: subAccountType
        })
      }
    }
  }

  // Parsear la cuenta principal (Débito)
  parseBlock(principalText, 'debito')
  
  // Parsear los rendimientos de inversión
  if (inversionesText) {
    parseBlock(inversionesText, 'inversion')
  }

  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
