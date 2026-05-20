const fs = require('fs');
const pdfRaw = require('pdf-parse');

async function test() {
  try {
    const pdfPath = 'C:\\Users\\Giova\\Downloads\\Phone Link\\Estados de cuenta\\2026-1.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    
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
    console.log('--- RAW PDF TEXT ---');
    console.log(text.substring(0, 3000));
  } catch (error) {
    console.error(error);
  }
}

test();
