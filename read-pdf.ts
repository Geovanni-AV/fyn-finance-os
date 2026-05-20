import fs from 'fs';
import pdfParse from 'pdf-parse';

async function test() {
  try {
    const pdfPath = 'C:\\Users\\Giova\\Downloads\\Phone Link\\Estados de cuenta\\2026-1.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    console.log('--- RAW PDF TEXT ---');
    console.log(data.text.substring(0, 4000));
  } catch (error) {
    console.error(error);
  }
}

test();
