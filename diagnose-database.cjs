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
  console.log("Database file not found in AppData/Roaming paths!");
  const roaming = path.join(os.homedir(), 'AppData', 'Roaming');
  if (fs.existsSync(roaming)) {
    const files = fs.readdirSync(roaming);
    console.log("Roaming folders:", files.filter(f => f.toLowerCase().includes('fyn') || f.toLowerCase().includes('electron') || f.toLowerCase().includes('app')));
  }
  process.exit(1);
}

console.log("Using database at:", dbPath);
const db = new Database(dbPath);

console.log("\n--- PROFILES ---");
const profiles = db.prepare("SELECT * FROM profiles").all();
console.log(profiles);

console.log("\n--- ACCOUNTS ---");
const accounts = db.prepare("SELECT * FROM accounts").all();
console.log(accounts);

console.log("\n--- TRANSACTIONS COUNT ---");
const txsCount = db.prepare("SELECT COUNT(*) as count FROM transactions").get();
console.log(txsCount);

process.exit(0);
