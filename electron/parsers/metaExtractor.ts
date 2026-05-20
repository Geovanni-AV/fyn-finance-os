export interface AccountMeta {
  accountNumber: string | null
  clabe:         string | null
  lastFour:      string | null
  holderName:    string | null
  accountName:   string        
  accountType:   'debito' | 'credito' | 'inversion' | 'efectivo'
  currency:      string
  finalBalance:  number | undefined
}

export function extractAccountMeta(text: string, bankId: string): AccountMeta | AccountMeta[] {
  const defaults: AccountMeta = {
    accountNumber: null,
    clabe: null,
    lastFour: null,
    holderName: null,
    accountName: `${bankId} Cuenta`,
    accountType: 'debito',
    currency: 'MXN',
    finalBalance: undefined,
  }

  switch (bankId) {
    case 'Openbank': return extractOpenbankMeta(text, defaults)
    case 'BBVA':     return extractBBVAMeta(text, defaults)
    case 'Nu':       return extractNuMeta(text, defaults)
    case 'Klar':     return extractKlarMeta(text, defaults)
    default:         return defaults
  }
}

function extractOpenbankMeta(text: string, base: AccountMeta): AccountMeta {
  const numMatch = text.match(/N[úu]mero de cuenta\s+(\d{7,12})/i)
  const clabeMatch = text.match(/Cuenta Clabe\s+(\d{18})/i)
  const isApartado = /Apartado Open/i.test(text)
  
  const balances = [...text.matchAll(/Saldo final\s+\$\s*([\d,]+\.\d{2})/g)]
  const finalBalance = balances.length >= 2
    ? parseFloat(balances[1][1].replace(/,/g, '')) 
    : balances[0]
      ? parseFloat(balances[0][1].replace(/,/g, ''))
      : undefined

  const accountNum = numMatch?.[1] ?? null
  const lastFour = accountNum ? accountNum.slice(-4) : clabeMatch?.[1].slice(-4) ?? null

  return {
    ...base,
    accountNumber: accountNum,
    clabe: clabeMatch?.[1] ?? null,
    lastFour,
    accountName: isApartado ? 'Openbank Apartado' : `Openbank Débito ${lastFour || ''}`.trim(),
    accountType: isApartado ? 'inversion' : 'debito',
    finalBalance,
  }
}

function extractBBVAMeta(text: string, base: AccountMeta): AccountMeta {
  const clabeMatch = text.match(/CLABE[:\s]+(\d{18})/i)
  const balanceMatch = text.match(/Saldo\s+(?:final|actual)[:\s]+\$?\s*([\d,]+\.\d{2})/i)
  const lastFour = clabeMatch?.[1].slice(-4) ?? null

  return {
    ...base,
    clabe: clabeMatch?.[1] ?? null,
    lastFour,
    accountName: `BBVA ••${lastFour || 'Nómina'}`,
    finalBalance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined,
  }
}

function extractNuMeta(text: string, base: AccountMeta): AccountMeta {
  const clabeMatch = text.match(/CLABE:\s*(\d{18})/i)
  const accountMatch = text.match(/Cuenta Nu:\s*(\d+)/i)
  const balanceMatch = text.match(/Saldo al generar este estado de cuenta\s+\$([\d,]+\.\d{2})/i) || text.match(/Saldo\s+final[:\s]+\$?\s*([\d,]+\.\d{2})/i)
  
  const clabe = clabeMatch?.[1] ?? null
  const accountNumber = accountMatch?.[1] ?? null
  const lastFour = clabe ? clabe.slice(-4) : (accountNumber ? accountNumber.slice(-4) : null)
  
  return {
    ...base,
    clabe,
    accountNumber,
    lastFour,
    accountName: `Nu Cuenta ••${lastFour || ''}`.trim(),
    finalBalance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined,
  }
}

function extractKlarMeta(text: string, base: AccountMeta): AccountMeta[] {
  const clabeMatch = text.match(/Cuenta CLABE\s+(\d{18})/i)
  const clabe = clabeMatch?.[1] ?? null
  const lastFour = clabe ? clabe.slice(-4) : null

  // Extraer el saldo final de la tabla resumen
  // Formato típico: "Klar Principal \n No. de contrato ... \n $X $Y -$Z $A $B $FINAL"
  // Para simplificar, buscaremos el bloque "Cuenta Saldo inicial Abonos Retiros/Cargos Ganancias Comisiones Saldo final"
  // y luego extraeremos las líneas.
  
  const accounts: AccountMeta[] = []

  // Klar Principal
  const principalBalanceMatch = text.match(/Klar Principal[\s\S]*?\$[\d,]+\.\d{2}[\s\S]*?\$([\d,]+\.\d{2})/)
  const finalBalancePrincipal = principalBalanceMatch ? parseFloat(principalBalanceMatch[1].replace(/,/g, '')) : 0
  
  accounts.push({
    ...base,
    clabe,
    lastFour,
    accountName: `Klar Principal ••${lastFour || ''}`.trim(),
    accountType: 'debito',
    finalBalance: finalBalancePrincipal,
  })

  // Apartados de inversión
  const invMatch = text.match(/Apartados de inversi[oó]n.*?(?:\$[\d,]+\.\d{2}.*?){5}\$([\d,]+\.\d{2})/i)
  if (invMatch) {
    accounts.push({
      ...base,
      accountNumber: null,
      clabe: null,
      lastFour: 'INV',
      accountName: 'Klar Inversiones',
      accountType: 'inversion',
      finalBalance: parseFloat(invMatch[1].replace(/,/g, '')),
    })
  } else {
    // Fallback if the regex above fails, try a simpler one:
    const invMatch2 = text.match(/Apartados de inversi[oó]n[\s\S]*?\$([\d,]+\.\d{2})\s*$/m)
    if (invMatch2) {
      accounts.push({
        ...base,
        accountNumber: null,
        clabe: null,
        lastFour: 'INV',
        accountName: 'Klar Inversiones',
        accountType: 'inversion',
        finalBalance: parseFloat(invMatch2[1].replace(/,/g, '')),
      })
    }
  }

  // Depósito Garantizado
  const depMatch = text.match(/Dep[oó]sito Garantizado[\s\S]*?No\. de contrato\s+(\w+)[\s\S]*?(?:\$[\d,]+\.\d{2}.*?){5}\$([\d,]+\.\d{2})/i)
  if (depMatch) {
    accounts.push({
      ...base,
      accountNumber: depMatch[1],
      clabe: null,
      lastFour: depMatch[1].slice(-4),
      accountName: 'Klar Depósito Garantía',
      accountType: 'inversion',
      finalBalance: parseFloat(depMatch[2].replace(/,/g, '')),
    })
  } else {
    // Fallback
    const depMatch2 = text.match(/Dep[oó]sito Garantizado[\s\S]*?\$([\d,]+\.\d{2})\s*$/m)
    if (depMatch2) {
      accounts.push({
        ...base,
        accountNumber: null,
        clabe: null,
        lastFour: 'GAR',
        accountName: 'Klar Depósito Garantía',
        accountType: 'inversion',
        finalBalance: parseFloat(depMatch2[1].replace(/,/g, '')),
      })
    }
  }

  // Crédito (Si existiera deuda o MSI)
  // Como estamos creando las cuentas base, si el usuario nos dijo "como deuda total", la deuda la insertamos en `debts`
  // Pero necesitamos una cuenta de crédito para asociar los pagos mensuales y cargos.
  const creditMatch = text.match(/L[íi]nea de cr[ée]dito/i) // Solo como heurística, en realidad Klar de crédito viene en un estado de cuenta de crédito
  // Para propósitos de este request, si el usuario tiene crédito, Klar suele ponerlo.
  // Vamos a crear la cuenta de crédito por defecto si hay "Pago línea de crédito" en las transacciones.
  if (text.match(/Pago l[íi]nea de cr[ée]dito/i)) {
    accounts.push({
      ...base,
      accountNumber: null,
      clabe: null,
      lastFour: 'CRED',
      accountName: 'Klar Crédito',
      accountType: 'credito',
      finalBalance: 0, // El balance real lo manejaríamos por las deudas o sumando
    })
  }

  return accounts
}
