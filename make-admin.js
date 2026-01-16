const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'local.db');
const db = new Database(dbPath);

console.log('Updating user AdminU to admin...');

const stmt = db.prepare(`
  UPDATE users 
  SET is_admin = 1, role = 'admin', verified = 1, email_verified = 1
  WHERE username = 'AdminU'
`);

const info = stmt.run();

if (info.changes > 0) {
    console.log('Success! AdminU is now an admin.');
} else {
    console.log('Error: User AdminU not found.');
}

db.close();
