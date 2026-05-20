const { parsePDF } = require('./dist-electron/services/pdf/index.js');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const pdfPath = 'C:\\Users\\Giova\\Downloads\\Phone Link\\Estados de cuenta\\2026-1.pdf';
    console.log('Testing PDF:', pdfPath);
    const result = await parsePDF(pdfPath);
    console.log('--- PARSE RESULT ---');
    console.log('Metadata:', result.metadata);
    console.log(`Transactions (${result.transactions.length}):`);
    console.log(result.transactions.slice(0, 5)); // show first 5
    if (result.transactions.length > 5) console.log('...');
  } catch (error) {
    console.error('--- PARSE ERROR ---');
    console.error(error);
  }
}

test();
