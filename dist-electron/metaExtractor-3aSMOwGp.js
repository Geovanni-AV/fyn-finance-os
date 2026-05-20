function f(a, l) {
  const n = {
    accountNumber: null,
    clabe: null,
    lastFour: null,
    holderName: null,
    accountName: `${l} Cuenta`,
    accountType: "debito",
    currency: "MXN",
    finalBalance: void 0
  };
  switch (l) {
    case "Openbank":
      return d(a, n);
    case "BBVA":
      return p(a, n);
    case "Nu":
      return m(a, n);
    case "Klar":
      return N(a, n);
    default:
      return n;
  }
}
function d(a, l) {
  const n = a.match(/N[úu]mero de cuenta\s+(\d{7,12})/i), c = a.match(/Cuenta Clabe\s+(\d{18})/i), t = /Apartado Open/i.test(a), e = [...a.matchAll(/Saldo final\s+\$\s*([\d,]+\.\d{2})/g)], o = e.length >= 2 ? parseFloat(e[1][1].replace(/,/g, "")) : e[0] ? parseFloat(e[0][1].replace(/,/g, "")) : void 0, s = (n == null ? void 0 : n[1]) ?? null, r = s ? s.slice(-4) : (c == null ? void 0 : c[1].slice(-4)) ?? null;
  return {
    ...l,
    accountNumber: s,
    clabe: (c == null ? void 0 : c[1]) ?? null,
    lastFour: r,
    accountName: t ? "Openbank Apartado" : `Openbank Débito ${r || ""}`.trim(),
    accountType: t ? "inversion" : "debito",
    finalBalance: o
  };
}
function p(a, l) {
  const n = a.match(/CLABE[:\s]+(\d{18})/i), c = a.match(/Saldo\s+(?:final|actual)[:\s]+\$?\s*([\d,]+\.\d{2})/i), t = (n == null ? void 0 : n[1].slice(-4)) ?? null;
  return {
    ...l,
    clabe: (n == null ? void 0 : n[1]) ?? null,
    lastFour: t,
    accountName: `BBVA ••${t || "Nómina"}`,
    finalBalance: c ? parseFloat(c[1].replace(/,/g, "")) : void 0
  };
}
function m(a, l) {
  const n = a.match(/CLABE:\s*(\d{18})/i), c = a.match(/Cuenta Nu:\s*(\d+)/i), t = a.match(/Saldo al generar este estado de cuenta\s+\$([\d,]+\.\d{2})/i) || a.match(/Saldo\s+final[:\s]+\$?\s*([\d,]+\.\d{2})/i), e = (n == null ? void 0 : n[1]) ?? null, o = (c == null ? void 0 : c[1]) ?? null, s = e ? e.slice(-4) : o ? o.slice(-4) : null;
  return {
    ...l,
    clabe: e,
    accountNumber: o,
    lastFour: s,
    accountName: `Nu Cuenta ••${s || ""}`.trim(),
    finalBalance: t ? parseFloat(t[1].replace(/,/g, "")) : void 0
  };
}
function N(a, l) {
  const n = a.match(/Cuenta CLABE\s+(\d{18})/i), c = (n == null ? void 0 : n[1]) ?? null, t = c ? c.slice(-4) : null, e = [], o = a.match(/Klar Principal[\s\S]*?\$[\d,]+\.\d{2}[\s\S]*?\$([\d,]+\.\d{2})/), s = o ? parseFloat(o[1].replace(/,/g, "")) : 0;
  e.push({
    ...l,
    clabe: c,
    lastFour: t,
    accountName: `Klar Principal ••${t || ""}`.trim(),
    accountType: "debito",
    finalBalance: s
  });
  const r = a.match(/Apartados de inversi[oó]n.*?(?:\$[\d,]+\.\d{2}.*?){5}\$([\d,]+\.\d{2})/i);
  if (r)
    e.push({
      ...l,
      accountNumber: null,
      clabe: null,
      lastFour: "INV",
      accountName: "Klar Inversiones",
      accountType: "inversion",
      finalBalance: parseFloat(r[1].replace(/,/g, ""))
    });
  else {
    const u = a.match(/Apartados de inversi[oó]n[\s\S]*?\$([\d,]+\.\d{2})\s*$/m);
    u && e.push({
      ...l,
      accountNumber: null,
      clabe: null,
      lastFour: "INV",
      accountName: "Klar Inversiones",
      accountType: "inversion",
      finalBalance: parseFloat(u[1].replace(/,/g, ""))
    });
  }
  const i = a.match(/Dep[oó]sito Garantizado[\s\S]*?No\. de contrato\s+(\w+)[\s\S]*?(?:\$[\d,]+\.\d{2}.*?){5}\$([\d,]+\.\d{2})/i);
  if (i)
    e.push({
      ...l,
      accountNumber: i[1],
      clabe: null,
      lastFour: i[1].slice(-4),
      accountName: "Klar Depósito Garantía",
      accountType: "inversion",
      finalBalance: parseFloat(i[2].replace(/,/g, ""))
    });
  else {
    const u = a.match(/Dep[oó]sito Garantizado[\s\S]*?\$([\d,]+\.\d{2})\s*$/m);
    u && e.push({
      ...l,
      accountNumber: null,
      clabe: null,
      lastFour: "GAR",
      accountName: "Klar Depósito Garantía",
      accountType: "inversion",
      finalBalance: parseFloat(u[1].replace(/,/g, ""))
    });
  }
  return a.match(/L[íi]nea de cr[ée]dito/i), a.match(/Pago l[íi]nea de cr[ée]dito/i) && e.push({
    ...l,
    accountNumber: null,
    clabe: null,
    lastFour: "CRED",
    accountName: "Klar Crédito",
    accountType: "credito",
    finalBalance: 0
    // El balance real lo manejaríamos por las deudas o sumando
  }), e;
}
export {
  f as extractAccountMeta
};
//# sourceMappingURL=metaExtractor-3aSMOwGp.js.map
