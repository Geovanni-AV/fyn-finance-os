function extractAccountMeta(text, bankId) {
  const defaults = {
    accountNumber: null,
    clabe: null,
    lastFour: null,
    holderName: null,
    accountName: `${bankId} Cuenta`,
    accountType: "debito",
    currency: "MXN",
    finalBalance: void 0
  };
  switch (bankId) {
    case "Openbank":
      return extractOpenbankMeta(text, defaults);
    case "BBVA":
      return extractBBVAMeta(text, defaults);
    case "Nu":
      return extractNuMeta(text, defaults);
    case "Klar":
      return extractKlarMeta(text, defaults);
    default:
      return defaults;
  }
}
function extractOpenbankMeta(text, base) {
  const numMatch = text.match(/N[úu]mero de cuenta\s+(\d{7,12})/i);
  const clabeMatch = text.match(/Cuenta Clabe\s+(\d{18})/i);
  const isApartado = /Apartado Open/i.test(text);
  const balances = [...text.matchAll(/Saldo final\s+\$\s*([\d,]+\.\d{2})/g)];
  const finalBalance = balances.length >= 2 ? parseFloat(balances[1][1].replace(/,/g, "")) : balances[0] ? parseFloat(balances[0][1].replace(/,/g, "")) : void 0;
  const accountNum = (numMatch == null ? void 0 : numMatch[1]) ?? null;
  const lastFour = accountNum ? accountNum.slice(-4) : (clabeMatch == null ? void 0 : clabeMatch[1].slice(-4)) ?? null;
  return {
    ...base,
    accountNumber: accountNum,
    clabe: (clabeMatch == null ? void 0 : clabeMatch[1]) ?? null,
    lastFour,
    accountName: isApartado ? "Openbank Apartado" : `Openbank Débito ${lastFour || ""}`.trim(),
    accountType: isApartado ? "inversion" : "debito",
    finalBalance
  };
}
function extractBBVAMeta(text, base) {
  const clabeMatch = text.match(/CLABE[:\s]+(\d{18})/i);
  const balanceMatch = text.match(/Saldo\s+(?:final|actual)[:\s]+\$?\s*([\d,]+\.\d{2})/i);
  const lastFour = (clabeMatch == null ? void 0 : clabeMatch[1].slice(-4)) ?? null;
  return {
    ...base,
    clabe: (clabeMatch == null ? void 0 : clabeMatch[1]) ?? null,
    lastFour,
    accountName: `BBVA ••${lastFour || "Nómina"}`,
    finalBalance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : void 0
  };
}
function extractNuMeta(text, base) {
  const clabeMatch = text.match(/CLABE:\s*(\d{18})/i);
  const accountMatch = text.match(/Cuenta Nu:\s*(\d+)/i);
  const balanceMatch = text.match(/Saldo al generar este estado de cuenta\s+\$([\d,]+\.\d{2})/i) || text.match(/Saldo\s+final[:\s]+\$?\s*([\d,]+\.\d{2})/i);
  const clabe = (clabeMatch == null ? void 0 : clabeMatch[1]) ?? null;
  const accountNumber = (accountMatch == null ? void 0 : accountMatch[1]) ?? null;
  const lastFour = clabe ? clabe.slice(-4) : accountNumber ? accountNumber.slice(-4) : null;
  return {
    ...base,
    clabe,
    accountNumber,
    lastFour,
    accountName: `Nu Cuenta ••${lastFour || ""}`.trim(),
    finalBalance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : void 0
  };
}
function extractKlarMeta(text, base) {
  const clabeMatch = text.match(/Cuenta CLABE\s+(\d{18})/i);
  const clabe = (clabeMatch == null ? void 0 : clabeMatch[1]) ?? null;
  const lastFour = clabe ? clabe.slice(-4) : null;
  const accounts = [];
  const principalBalanceMatch = text.match(/Klar Principal[\s\S]*?\$[\d,]+\.\d{2}[\s\S]*?\$([\d,]+\.\d{2})/);
  const finalBalancePrincipal = principalBalanceMatch ? parseFloat(principalBalanceMatch[1].replace(/,/g, "")) : 0;
  accounts.push({
    ...base,
    clabe,
    lastFour,
    accountName: `Klar Principal ••${lastFour || ""}`.trim(),
    accountType: "debito",
    finalBalance: finalBalancePrincipal
  });
  const invMatch = text.match(/Apartados de inversi[oó]n.*?(?:\$[\d,]+\.\d{2}.*?){5}\$([\d,]+\.\d{2})/i);
  if (invMatch) {
    accounts.push({
      ...base,
      accountNumber: null,
      clabe: null,
      lastFour: "INV",
      accountName: "Klar Inversiones",
      accountType: "inversion",
      finalBalance: parseFloat(invMatch[1].replace(/,/g, ""))
    });
  } else {
    const invMatch2 = text.match(/Apartados de inversi[oó]n[\s\S]*?\$([\d,]+\.\d{2})\s*$/m);
    if (invMatch2) {
      accounts.push({
        ...base,
        accountNumber: null,
        clabe: null,
        lastFour: "INV",
        accountName: "Klar Inversiones",
        accountType: "inversion",
        finalBalance: parseFloat(invMatch2[1].replace(/,/g, ""))
      });
    }
  }
  const depMatch = text.match(/Dep[oó]sito Garantizado[\s\S]*?No\. de contrato\s+(\w+)[\s\S]*?(?:\$[\d,]+\.\d{2}.*?){5}\$([\d,]+\.\d{2})/i);
  if (depMatch) {
    accounts.push({
      ...base,
      accountNumber: depMatch[1],
      clabe: null,
      lastFour: depMatch[1].slice(-4),
      accountName: "Klar Depósito Garantía",
      accountType: "inversion",
      finalBalance: parseFloat(depMatch[2].replace(/,/g, ""))
    });
  } else {
    const depMatch2 = text.match(/Dep[oó]sito Garantizado[\s\S]*?\$([\d,]+\.\d{2})\s*$/m);
    if (depMatch2) {
      accounts.push({
        ...base,
        accountNumber: null,
        clabe: null,
        lastFour: "GAR",
        accountName: "Klar Depósito Garantía",
        accountType: "inversion",
        finalBalance: parseFloat(depMatch2[1].replace(/,/g, ""))
      });
    }
  }
  text.match(/L[íi]nea de cr[ée]dito/i);
  if (text.match(/Pago l[íi]nea de cr[ée]dito/i)) {
    accounts.push({
      ...base,
      accountNumber: null,
      clabe: null,
      lastFour: "CRED",
      accountName: "Klar Crédito",
      accountType: "credito",
      finalBalance: 0
      // El balance real lo manejaríamos por las deudas o sumando
    });
  }
  return accounts;
}
export {
  extractAccountMeta
};
//# sourceMappingURL=metaExtractor-B4K3wmMR.js.map
