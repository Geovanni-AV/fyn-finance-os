function p(n, t) {
  const a = {
    accountNumber: null,
    clabe: null,
    lastFour: null,
    holderName: null,
    accountName: `${t} Cuenta`,
    accountType: "debito",
    currency: "MXN",
    finalBalance: void 0
  };
  switch (t) {
    case "Openbank":
      return r(n, a);
    case "BBVA":
      return i(n, a);
    case "Nu":
      return d(n, a);
    case "Klar":
      return m(n, a);
    default:
      return a;
  }
}
function r(n, t) {
  const a = n.match(/N[úu]mero de cuenta\s+(\d{7,12})/i), c = n.match(/Cuenta Clabe\s+(\d{18})/i), e = /Apartado Open/i.test(n), l = [...n.matchAll(/Saldo final\s+\$\s*([\d,]+\.\d{2})/g)], s = l.length >= 2 ? parseFloat(l[1][1].replace(/,/g, "")) : l[0] ? parseFloat(l[0][1].replace(/,/g, "")) : void 0, o = (a == null ? void 0 : a[1]) ?? null, u = o ? o.slice(-4) : (c == null ? void 0 : c[1].slice(-4)) ?? null;
  return {
    ...t,
    accountNumber: o,
    clabe: (c == null ? void 0 : c[1]) ?? null,
    lastFour: u,
    accountName: e ? "Openbank Apartado" : `Openbank Débito ${u || ""}`.trim(),
    accountType: e ? "inversion" : "debito",
    finalBalance: s
  };
}
function i(n, t) {
  const a = n.match(/CLABE[:\s]+(\d{18})/i), c = n.match(/Saldo\s+(?:final|actual)[:\s]+\$?\s*([\d,]+\.\d{2})/i), e = (a == null ? void 0 : a[1].slice(-4)) ?? null;
  return {
    ...t,
    clabe: (a == null ? void 0 : a[1]) ?? null,
    lastFour: e,
    accountName: `BBVA ••${e || "Nómina"}`,
    finalBalance: c ? parseFloat(c[1].replace(/,/g, "")) : void 0
  };
}
function d(n, t) {
  const a = n.match(/CLABE:\s*(\d{18})/i), c = n.match(/Cuenta Nu:\s*(\d+)/i), e = n.match(/Saldo al generar este estado de cuenta\s+\$([\d,]+\.\d{2})/i) || n.match(/Saldo\s+final[:\s]+\$?\s*([\d,]+\.\d{2})/i), l = (a == null ? void 0 : a[1]) ?? null, s = (c == null ? void 0 : c[1]) ?? null, o = l ? l.slice(-4) : s ? s.slice(-4) : null;
  return {
    ...t,
    clabe: l,
    accountNumber: s,
    lastFour: o,
    accountName: `Nu Cuenta ••${o || ""}`.trim(),
    finalBalance: e ? parseFloat(e[1].replace(/,/g, "")) : void 0
  };
}
function m(n, t) {
  const a = n.match(/Cuenta CLABE\s+(\d{18})/i), c = n.match(/Saldo final del periodo:\s+\$([\d,]+\.\d{2})/i), e = (a == null ? void 0 : a[1]) ?? null, l = e ? e.slice(-4) : null;
  return {
    ...t,
    clabe: e,
    lastFour: l,
    accountName: `Klar Cuenta ••${l || ""}`.trim(),
    finalBalance: c ? parseFloat(c[1].replace(/,/g, "")) : void 0
  };
}
export {
  p as extractAccountMeta
};
//# sourceMappingURL=metaExtractor-CqIJm2Er.js.map
