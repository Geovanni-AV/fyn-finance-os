const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { getDatabase, initSchema } = require('./dist-electron/db/database');
const { detectBank, parsePdfContent } = require('./dist-electron/parsers/index');
const { extractAccountMeta } = require('./dist-electron/parsers/metaExtractor');
const { inferCategory, generateTxHash } = require('./dist-electron/utils/categoryInfer');
const pdfRaw = require('pdf-parse');

app.whenReady().then(async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'fyn-finance.sqlite');
    const db = getDatabase(dbPath);
    console.log('Testing with DB:', dbPath);

    const filePath = 'C:\\Users\\Giova\\Downloads\\Phone Link\\Estados de cuenta\\2026-1.pdf';
    console.log('[Main] Starting PDF parse for:', filePath);

    const dataBuffer = fs.readFileSync(filePath);
    let text = '';
    if (pdfRaw && pdfRaw.PDFParse) {
      const parser = new pdfRaw.PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      text = result.text;
    } else {
      const parsePdf = (typeof pdfRaw === 'function') ? pdfRaw : pdfRaw.default;
      const data = await parsePdf(dataBuffer);
      text = data.text;
    }

    const bankId = detectBank(text);
    console.log(`[Main] Bank detected: ${bankId}`);
    
    if (bankId === 'Generic') {
      console.error('Banco no reconocido');
      app.quit();
      return;
    }

    const meta = extractAccountMeta(text, bankId);
    console.log('Metadata:', meta);
    
    const parsed = parsePdfContent(bankId, text);
    console.log(`[Main] Transactions parsed: ${parsed.length}`);
    if (parsed.length > 0) {
      console.log('Sample txs:');
      console.log(parsed.slice(0, 5));
    }

    app.quit();
  } catch (err) {
    console.error(err);
    app.quit();
  }
});
