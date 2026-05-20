const O = [
  /Retiro a Apartado Open/i,
  /Abono desde Apartado Open/i,
  /Abono de intereses/i,
  /Abono desde Cuenta Débito Open/i,
  /Retiro a Cuenta Débito Open/i
];
function N(e) {
  return O.some((n) => n.test(e));
}
function D(e) {
  const n = e.split("/");
  if (n.length !== 3) return "";
  const [s, t, r] = n;
  return `${r.length === 2 ? `20${r}` : r}-${t.padStart(2, "0")}-${s.padStart(2, "0")}`;
}
function T(e) {
  return parseFloat(e.replace(/[$,\s]/g, "")) || 0;
}
function F(e) {
  const n = [], s = e.split(`
`).map((r) => r.trim()).filter(Boolean);
  let t = 0;
  for (; t < s.length; ) {
    const r = s[t], p = r.match(/^(\d{2}\/\d{2}\/\d{2,4})(.*)/);
    if (!p) {
      t++;
      continue;
    }
    const u = D(p[1]);
    if (!u) {
      t++;
      continue;
    }
    let i = p[2].trim();
    i.length < 3 && s[t + 1] && !s[t + 1].match(/^\d{2}\/\d{2}\/\d{2,4}/) && (i = s[t + 1].trim(), t++);
    let d = r;
    d.match(/\$\s*[\d,]+\.\d{2}/) || (d = (s[t + 1] || "") + " " + (s[t + 2] || ""));
    const o = [...d.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map((l) => T(l[1]));
    let a = 0, c = "gasto";
    if (o.length >= 3) {
      const l = o[0], g = o[1];
      l > 0 ? (a = l, c = "ingreso") : (a = g, c = "gasto");
    } else if (o.length === 2)
      a = o[0], c = /recib|abono|depósit|interés|interes|SPEI recib|traspaso/i.test(i) ? "ingreso" : "gasto";
    else {
      t++;
      continue;
    }
    if (a <= 0) {
      t++;
      continue;
    }
    if (N(i)) {
      t++;
      continue;
    }
    const m = i.replace(/\d{15,}/g, "").replace(/\s{2,}/g, " ").trim();
    n.push({
      date: u,
      amount: a,
      type: c,
      description: m || "Transferencia Openbank"
    }), t++;
  }
  return n;
}
function M(e) {
  const n = [];
  let s = (/* @__PURE__ */ new Date()).getFullYear().toString();
  const t = /(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre).*?(\d{4})/i.exec(e);
  t && (s = t[1]);
  const r = e.split(/Rendimientos y retenciones/i), p = r[0], u = r.length > 1 ? r[1] : "", i = /(\d{2}\/\d{2})\s+(.+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/g, d = (o, a) => {
    let c;
    for (; (c = i.exec(o)) !== null; ) {
      const [m, l, g, b, A] = c, [$, w] = l.split("/"), y = `${s}-${w}-${$}`, f = parseFloat(b.replace(/,/g, "")), h = parseFloat(A.replace(/,/g, "")), S = g.trim();
      if (!(f === 0 && h === 0) && (f > 0 && n.push({
        date: y,
        description: S,
        amount: f,
        type: "gasto",
        subAccount: a
      }), h > 0)) {
        const B = f > 0 && h > 0 ? " (Abono)" : "";
        n.push({
          date: y,
          description: `${S}${B}`,
          amount: h,
          type: "ingreso",
          subAccount: a
        });
      }
    }
  };
  return d(p, "debito"), u && d(u, "inversion"), n.sort((o, a) => new Date(o.date).getTime() - new Date(a.date).getTime());
}
function E(e) {
  return /Openbank/i.test(e) ? "Openbank" : /BBVA/i.test(e) ? "BBVA" : /\bNu\b/i.test(e) || /Nu México/i.test(e) ? "Nu" : /Klar/i.test(e) || /Klar Technologies/i.test(e) ? "Klar" : "Generic";
}
function P(e, n) {
  switch (e) {
    case "Openbank":
      return F(n);
    case "BBVA":
      return R(n);
    case "Nu":
      return k(n);
    case "Klar":
      return M(n);
    default:
      return [];
  }
}
function R(e) {
  const n = [], s = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
  let t;
  for (; (t = s.exec(e)) !== null; ) {
    const [r, p, u, i, d] = t, o = parseFloat(i ? i.replace(/,/g, "") : d.replace(/,/g, "")), a = i ? "gasto" : "ingreso", [c, m, l] = p.split("/"), g = `${l}-${m}-${c}`;
    n.push({
      date: g,
      description: u.trim(),
      amount: o,
      type: a
    });
  }
  return n;
}
function k(e) {
  const n = [], s = /(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(.+?)\s+([+-]\$[\d,]+\.\d{2})/gi;
  let t;
  const r = {
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
    const [p, u, i, d] = t, o = u.trim().split(/\s+/);
    let a = "";
    if (o.length === 3) {
      const b = o[0].padStart(2, "0"), A = o[1].toUpperCase(), $ = o[2], w = r[A] || "01";
      a = `${$}-${w}-${b}`;
    } else
      continue;
    const c = d.replace(/[+$]/g, "").replace(/,/g, ""), m = parseFloat(c), l = Math.abs(m), g = m < 0 ? "gasto" : "ingreso";
    n.push({
      date: a,
      description: i.trim(),
      amount: l,
      type: g
    });
  }
  return n;
}
export {
  E as detectBank,
  P as parsePdfContent
};
//# sourceMappingURL=index-BRKsNUSA.js.map
