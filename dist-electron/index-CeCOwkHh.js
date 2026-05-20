const INTERNAL_PATTERNS = [
  /Retiro a Apartado Open/i,
  /Abono desde Apartado Open/i,
  /Abono de intereses/i,
  /Abono desde Cuenta Débito Open/i,
  /Retiro a Cuenta Débito Open/i
];
function isInternal(description) {
  return INTERNAL_PATTERNS.some((p) => p.test(description));
}
function parseDate(raw) {
  const parts = raw.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
function parseAmount(raw) {
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}
function parseOpenbank(text) {
  const transactions = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{2,4})(.*)/);
    if (!dateMatch) {
      i++;
      continue;
    }
    const dateStr = parseDate(dateMatch[1]);
    if (!dateStr) {
      i++;
      continue;
    }
    let description = dateMatch[2].trim();
    if (description.length < 3 && lines[i + 1] && !lines[i + 1].match(/^\d{2}\/\d{2}\/\d{2,4}/)) {
      description = lines[i + 1].trim();
      i++;
    }
    let amountLine = line;
    if (!amountLine.match(/\$\s*[\d,]+\.\d{2}/)) {
      amountLine = (lines[i + 1] || "") + " " + (lines[i + 2] || "");
    }
    const amounts = [...amountLine.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map((m) => parseAmount(m[1]));
    let movement = 0;
    let type = "gasto";
    if (amounts.length >= 3) {
      const deposit = amounts[0];
      const withdrawal = amounts[1];
      if (deposit > 0) {
        movement = deposit;
        type = "ingreso";
      } else {
        movement = withdrawal;
        type = "gasto";
      }
    } else if (amounts.length === 2) {
      movement = amounts[0];
      const isDeposit = /recib|abono|depósit|interés|interes|SPEI recib|traspaso/i.test(description);
      type = isDeposit ? "ingreso" : "gasto";
    } else {
      i++;
      continue;
    }
    if (movement <= 0) {
      i++;
      continue;
    }
    if (isInternal(description)) {
      i++;
      continue;
    }
    const cleanDesc = description.replace(/\d{15,}/g, "").replace(/\s{2,}/g, " ").trim();
    transactions.push({
      date: dateStr,
      amount: movement,
      type,
      description: cleanDesc || "Transferencia Openbank"
    });
    i++;
  }
  return transactions;
}
function parseKlar(text) {
  const transactions = [];
  let year = (/* @__PURE__ */ new Date()).getFullYear().toString();
  const yearMatch = /(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre).*?(\d{4})/i.exec(text);
  if (yearMatch) {
    year = yearMatch[1];
  }
  const regex = /(\d{2}\/\d{2})\s+(.+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, descriptionRaw, cargosStr, abonosStr] = match;
    const [day, month] = dateStr.split("/");
    const date = `${year}-${month}-${day}`;
    const cargo = parseFloat(cargosStr.replace(/,/g, ""));
    const abono = parseFloat(abonosStr.replace(/,/g, ""));
    const description = descriptionRaw.trim();
    if (cargo === 0 && abono === 0) continue;
    if (cargo > 0) {
      transactions.push({
        date,
        description,
        amount: cargo,
        type: "gasto"
      });
    }
    if (abono > 0) {
      const descPostfix = cargo > 0 && abono > 0 ? " (Abono)" : "";
      transactions.push({
        date,
        description: `${description}${descPostfix}`,
        amount: abono,
        type: "ingreso"
      });
    }
  }
  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
function detectBank(text) {
  if (/Openbank/i.test(text)) return "Openbank";
  if (/BBVA/i.test(text)) return "BBVA";
  if (/Nu/i.test(text) || /Nu México/i.test(text)) return "Nu";
  if (/Klar/i.test(text) || /Klar Technologies/i.test(text)) return "Klar";
  return "Generic";
}
function parsePdfContent(bank, text) {
  switch (bank) {
    case "Openbank":
      return parseOpenbank(text);
    case "BBVA":
      return parseBBVA(text);
    case "Nu":
      return parseNu(text);
    case "Klar":
      return parseKlar(text);
    default:
      return [];
  }
}
function parseBBVA(text) {
  const transactions = [];
  const regex = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, description, withdrawal, deposit] = match;
    const amount = withdrawal ? parseFloat(withdrawal.replace(/,/g, "")) : parseFloat(deposit.replace(/,/g, ""));
    const type = withdrawal ? "gasto" : "ingreso";
    const [day, month, year] = dateStr.split("/");
    const date = `${year}-${month}-${day}`;
    transactions.push({
      date,
      description: description.trim(),
      amount,
      type
    });
  }
  return transactions;
}
function parseNu(text) {
  const transactions = [];
  const regex = /(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(.+?)\s+([+-]\$[\d,]+\.\d{2})/gi;
  let match;
  const MONTH_MAP = {
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
  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, description, amountStr] = match;
    const dateParts = dateStr.trim().split(/\s+/);
    let date = "";
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, "0");
      const monthAbbr = dateParts[1].toUpperCase();
      const year = dateParts[2];
      const month = MONTH_MAP[monthAbbr] || "01";
      date = `${year}-${month}-${day}`;
    } else {
      continue;
    }
    const rawAmountStr = amountStr.replace(/[+$]/g, "").replace(/,/g, "");
    const rawAmount = parseFloat(rawAmountStr);
    const amount = Math.abs(rawAmount);
    const type = rawAmount < 0 ? "gasto" : "ingreso";
    transactions.push({
      date,
      description: description.trim(),
      amount,
      type
    });
  }
  return transactions;
}
export {
  detectBank,
  parsePdfContent
};
//# sourceMappingURL=index-CeCOwkHh.js.map
