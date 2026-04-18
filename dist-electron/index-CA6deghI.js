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
    if (amounts.length < 2) {
      i++;
      continue;
    }
    const movimiento = amounts[amounts.length - 2];
    if (movimiento <= 0) {
      i++;
      continue;
    }
    if (isInternal(description)) {
      i++;
      continue;
    }
    let type;
    if (amounts.length >= 3) {
      const deposit = amounts[0];
      const withdrawal = amounts[1];
      type = deposit > 0 && withdrawal === 0 ? "ingreso" : "gasto";
    } else {
      const isDeposit = /recib|abono|depósit|SPEI recib/i.test(description);
      type = isDeposit ? "ingreso" : "gasto";
    }
    const cleanDesc = description.replace(/\d{15,}/g, "").replace(/\s{2,}/g, " ").trim();
    transactions.push({
      date: dateStr,
      amount: movimiento,
      type,
      description: cleanDesc || "Transferencia Openbank"
    });
    i++;
  }
  return transactions;
}
function detectBank(text) {
  if (/Openbank/i.test(text)) return "Openbank";
  if (/BBVA/i.test(text)) return "BBVA";
  if (/Nu/i.test(text) || /Nu México/i.test(text)) return "Nu";
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
  const regex = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [_, date, description, amountStr] = match;
    const rawAmount = parseFloat(amountStr.replace(/,/g, ""));
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
//# sourceMappingURL=index-CA6deghI.js.map
