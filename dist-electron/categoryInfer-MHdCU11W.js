const E = [
  [/OXXO|7.?ELEVEN|WALMART|SORIANA|CHEDRAUI|COSTCO/i, "supermercado"],
  [/UBER\s*EATS|RAPPI|DIDI\s*FOOD|DOMINOS|MCDONALDS/i, "restaurantes"],
  [/NETFLIX|SPOTIFY|DISNEY|HBO|AMAZON\s*PRIME/i, "entretenimiento"],
  [/CFE|TELMEX|TOTALPLAY|IZZI|TELCEL|AT&T/i, "servicios"],
  [/FARMA|FARMACIA|SIMILARES|BENAVIDES/i, "salud"],
  [/GASOLINA|PEMEX|SHELL|BP/i, "transporte"],
  [/UBER(?!\s*EATS)|DIDI(?!\s*FOOD)|CABIFY/i, "transporte"],
  [/LIVERPOOL|ZARA|H&M|PALACIO/i, "ropa"],
  [/donacion|DONAT/i, "otros"],
  [/SPEI recib|nómina|NOMINA|sueldo/i, "nomina"],
  [/SPEI envi|transferencia/i, "otros"]
];
function a(e, r) {
  for (const [o, n] of E)
    if (o.test(e)) return n;
  return "otros";
}
function I(e, r, o) {
  const n = o.replace(/\s/g, "").toLowerCase(), A = `${e}|${r}|${n}`;
  let t = 0;
  for (let s = 0; s < A.length; s++) {
    const i = A.charCodeAt(s);
    t = (t << 5) - t + i, t = t & t;
  }
  return Math.abs(t).toString(16);
}
export {
  I as generateTxHash,
  a as inferCategory
};
//# sourceMappingURL=categoryInfer-MHdCU11W.js.map
