const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const possiblePaths = [
  path.join(os.homedir(), 'AppData', 'Roaming', 'fyn-finance-os', 'fyn-finance.sqlite'),
  path.join(os.homedir(), 'AppData', 'Roaming', 'fyn-app', 'fyn-finance.sqlite'),
];

let dbPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dbPath = p;
    break;
  }
}

if (!dbPath) {
  console.log("Database file not found!");
  process.exit(1);
}

console.log("Using database at:", dbPath);
const db = new Database(dbPath, { verbose: console.log });

// Replicate main.ts's imported parser and infer functions
const pdfRaw = require('./node_modules/pdf-parse');

function detectBank(text) {
  if (/Openbank/i.test(text)) return 'Openbank';
  if (/BBVA/i.test(text)) return 'BBVA';
  if (/Nu/i.test(text) || /Nu México/i.test(text)) return 'Nu';
  return 'Generic';
}

function parseNu(text) {
  const transactions = [];
  const regex = /(\d{2}\s+[A-Z]{3}\s+\d{4})\s+(.+?)\s+([+-]\$[\d,]+\.\d{2})/gi;
  let match;
  const MONTH_MAP = {
    ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
    JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12'
  };
  while ((match = regex.exec(text)) !== null) {
    const [_, dateStr, description, amountStr] = match;
    const dateParts = dateStr.trim().split(/\s+/);
    let date = '';
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0');
      const monthAbbr = dateParts[1].toUpperCase();
      const year = dateParts[2];
      const month = MONTH_MAP[monthAbbr] || '01';
      date = `${year}-${month}-${day}`;
    } else {
      continue;
    }
    const rawAmountStr = amountStr.replace(/[+$]/g, '').replace(/,/g, '');
    const rawAmount = parseFloat(rawAmountStr);
    const amount = Math.abs(rawAmount);
    const type = rawAmount < 0 ? 'gasto' : 'ingreso';
    transactions.push({ date, description: description.trim(), amount, type });
  }
  return transactions;
}

function parsePdfContent(bank, text) {
  if (bank === 'Nu') return parseNu(text);
  return [];
}

function extractNuMeta(text) {
  const clabeNu = text.match(/CLABE:\s*(\d{18})/i);
  const accountNu = text.match(/Cuenta Nu:\s*(\d+)/i);
  const balanceNu = text.match(/Saldo al generar este estado de cuenta\s+\$([\d,]+\.\d{2})/i) || text.match(/Saldo\s+final[:\s]+\$?\s*([\d,]+\.\d{2})/i);
  const cl = clabeNu?.[1] ?? null;
  const acNum = accountNu?.[1] ?? null;
  const lf = cl ? cl.slice(-4) : (acNum ? acNum.slice(-4) : null);
  return {
    accountNumber: acNum,
    clabe: cl,
    lastFour: lf,
    accountName: `Nu Cuenta ••${lf || ''}`.trim(),
    accountType: 'debito',
    currency: 'MXN',
    finalBalance: balanceNu ? parseFloat(balanceNu[1].replace(/,/g, '')) : undefined,
  };
}

const targetDir = 'C:\\Users\\Giova\\Downloads\\Phone Link\\Estados de cuenta';
const files = ['Enero 2026.pdf', 'Febrero 2026.pdf', 'Marzo 2026.pdf', 'Abril 2026.pdf'];

async function testIngest() {
  db.exec('PRAGMA foreign_keys = ON;');
  
  // Clear tables to force account creation
  db.exec('DELETE FROM transactions;');
  db.exec('DELETE FROM accounts;');
  console.log('Cleared accounts and transactions tables.\n');
  
  for (const filename of files) {
    const filePath = path.join(targetDir, filename);
    console.log(`\n===================================`);
    console.log(`Ingesting file: ${filename}`);
    
    const dataBuffer = fs.readFileSync(filePath);
    let text = '';
    if (pdfRaw && pdfRaw.PDFParse) {
      console.log('[Main] Instantiating PDFParse with data buffer...');
      const parser = new pdfRaw.PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
    } else {
      const parsePdf = (typeof pdfRaw === 'function') ? pdfRaw : pdfRaw.default;
      if (typeof parsePdf !== 'function') {
        throw new Error(`pdf-parse is not a function (it is a ${typeof parsePdf})`);
      }
      const data = await parsePdf(dataBuffer);
      text = data.text;
    }
    
    const bankId = detectBank(text);
    console.log(`Bank: ${bankId}`);
    
    const meta = extractNuMeta(text);
    console.log(`Meta:`, JSON.stringify(meta));
    
    const profile = db.prepare('SELECT id FROM profiles LIMIT 1').get();
    if (!profile) {
      console.log('Error: No profile configured!');
      return;
    }
    console.log(`Profile ID: ${profile.id}`);
    
    let account = db.prepare(`
      SELECT * FROM accounts 
      WHERE user_id = ? AND bank = ? AND (last_four = ? OR name = ?)
    `).get(profile.id, bankId, meta.lastFour, meta.accountName);
    
    if (!account) {
      console.log(`Creating new account: ${meta.accountName}`);
      const result = db.prepare(`
        INSERT INTO accounts (user_id, name, bank, type, balance, currency, color, last_four)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `).get(
        profile.id,
        meta.accountName,
        bankId,
        meta.accountType,
        meta.finalBalance || 0,
        meta.currency,
        '#820AD1',
        meta.lastFour
      );
      console.log('Account creation result:', result);
      account = { id: result.id, name: meta.accountName };
    } else {
      console.log(`Found existing account ID: ${account.id}`);
    }
    
    const parsed = parsePdfContent(bankId, text);
    console.log(`Parsed transactions: ${parsed.length}`);
    
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO transactions 
      (user_id, account_id, date, amount, type, category, description, source, dedup_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Helper functions from categoryInfer
    const generateTxHash = (date, amount, desc) => {
      const crypto = require('crypto');
      return crypto.createHash('md5')
        .update(`${date}_${amount}_${desc}`)
        .digest('hex');
    };
    
    const inferCategory = (desc) => 'Otros';

    let inserted = 0;
    let duplicates = 0;
    
    try {
      const transaction = db.transaction((txs) => {
        for (const tx of txs) {
          const hash = generateTxHash(tx.date, tx.amount, tx.description);
          const result = insertStmt.run(
            profile.id,
            account.id,
            tx.date,
            tx.amount,
            tx.type,
            inferCategory(tx.description),
            tx.description,
            'pdf',
            hash
          );
          if (result.changes > 0) inserted++;
          else duplicates++;
        }
      });
      
      transaction(parsed);
      console.log(`Inserted: ${inserted}, Duplicates: ${duplicates}`);
      
      if (meta.finalBalance !== undefined) {
        db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(meta.finalBalance, account.id);
        console.log(`Updated balance to: ${meta.finalBalance}`);
      }
    } catch (err) {
      console.error(`ERROR ingesting ${filename}:`, err);
    }
  }
}

testIngest();
