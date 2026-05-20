const $ = [
  /Retiro a Apartado Open/i,
  /Abono desde Apartado Open/i,
  /Abono de intereses/i,
  /Abono desde Cuenta Débito Open/i,
  /Retiro a Cuenta Débito Open/i
];
function w(e) {
  return $.some((n) => n.test(e));
}
function y(e) {
  const n = e.split("/");
  if (n.length !== 3) return "";
  const [s, t, a] = n;
  return `${a.length === 2 ? `20${a}` : a}-${t.padStart(2, "0")}-${s.padStart(2, "0")}`;
}
function S(e) {
  return parseFloat(e.replace(/[$,\s]/g, "")) || 0;
}
function O(e) {
  const n = [], s = e.split(`
`).map((a) => a.trim()).filter(Boolean);
  let t = 0;
  for (; t < s.length; ) {
    const a = s[t], d = a.match(/^(\d{2}\/\d{2}\/\d{2,4})(.*)/);
    if (!d) {
      t++;
      continue;
    }
    const u = y(d[1]);
    if (!u) {
      t++;
      continue;
    }
    let o = d[2].trim();
    o.length < 3 && s[t + 1] && !s[t + 1].match(/^\d{2}\/\d{2}\/\d{2,4}/) && (o = s[t + 1].trim(), t++);
    let m = a;
    m.match(/\$\s*[\d,]+\.\d{2}/) || (m = (s[t + 1] || "") + " " + (s[t + 2] || ""));
    const r = [...m.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map((c) => S(c[1]));
    let i = 0, l = "gasto";
    if (r.length >= 3) {
      const c = r[0], p = r[1];
      c > 0 ? (i = c, l = "ingreso") : (i = p, l = "gasto");
    } else if (r.length === 2)
      i = r[0], l = /recib|abono|depósit|interés|interes|SPEI recib|traspaso/i.test(o) ? "ingreso" : "gasto";
    else {
      t++;
      continue;
    }
    if (i <= 0) {
      t++;
      continue;
    }
    if (w(o)) {
      t++;
      continue;
    }
    const g = o.replace(/\d{15,}/g, "").replace(/\s{2,}/g, " ").trim();
    n.push({
      date: u,
      amount: i,
      type: l,
      description: g || "Transferencia Openbank"
    }), t++;
  }
  return n;
}
function B(e) {
  const n = [];
  let s = (/* @__PURE__ */ new Date()).getFullYear().toString();
  const t = /(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre).*?(\d{4})/i.exec(e);
  t && (s = t[1]);
  const a = /(\d{2}\/\d{2})\s+(.+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/g;
  let d;
  for (; (d = a.exec(e)) !== null; ) {
    const [u, o, m, r, i] = d, [l, g] = o.split("/"), c = `${s}-${g}-${l}`, p = parseFloat(r.replace(/,/g, "")), f = parseFloat(i.replace(/,/g, "")), h = m.trim();
    if (!(p === 0 && f === 0) && (p > 0 && n.push({
      date: c,
      description: h,
      amount: p,
      type: "gasto"
    }), f > 0)) {
      const b = p > 0 && f > 0 ? " (Abono)" : "";
      n.push({
        date: c,
        description: `${h}${b}`,
        amount: f,
        type: "ingreso"
      });
    }
  }
  return n.sort((u, o) => new Date(u.date).getTime() - new Date(o.date).getTime());
}
function T(e) {
  return /Openbank/i.test(e) ? "Openbank" : /BBVA/i.test(e) ? "BBVA" : /Nu/i.test(e) || /Nu México/i.test(e) ? "Nu" : /Klar/i.test(e) || /Klar Technologies/i.test(e) ? "Klar" : "Generic";
}
function F(e, n) {
  switch (e) {
    case "Openbank":
      return O(n);
    case "BBVA":
      return N(n);
    case "Nu":
      return D(n);
    case "Klar":
      return B(n);
    default:
      return [];
  }
}
function N(e) {
  const n = [], s = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
  let t;
  for (; (t = s.exec(e)) !== null; ) {
    const [a, d, u, o, m] = t, r = parseFloat(o ? o.replace(/,/g, "") : m.replace(/,/g, "")), i = o ? "gasto" : "ingreso", [l, g, c] = d.split("/"), p = `${c}-${g}-${l}`;
    n.push({
      date: p,
      description: u.trim(),
      amount: r,
      type: i
    });
  }
  return n;
}
function D(e) {
  const n = [], s = /(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(.+?)\s+([+-]\$[\d,]+\.\d{2})/gi;
  let t;
  const a = {
    ENE: "01",
    FEB: "02",
    MAR: "03",
    ABR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AGO: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DIC: "12"
  };
  for (; (t = s.exec(e)) !== null; ) {
    const [d, u, o, m] = t, r = u.trim().split(/\s+/);
    let i = "";
    if (r.length === 3) {
      const f = r[0].padStart(2, "0"), h = r[1].toUpperCase(), b = r[2], A = a[h] || "01";
      i = `${b}-${A}-${f}`;
    } else
      continue;
    const l = m.replace(/[+$]/g, "").replace(/,/g, ""), g = parseFloat(l), c = Math.abs(g), p = g < 0 ? "gasto" : "ingreso";
    n.push({
      date: i,
      description: o.trim(),
      amount: c,
      type: p
    });
  }
  return n;
}
export {
  T as detectBank,
  F as parsePdfContent
};
//# sourceMappingURL=index-2adxF1QK.js.map
