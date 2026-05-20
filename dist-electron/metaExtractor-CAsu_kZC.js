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
export {
  extractAccountMeta
};
//# sourceMappingURL=metaExtractor-CAsu_kZC.js.map
