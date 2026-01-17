const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'local.db');
console.log('Opening database at:', dbPath);

const db = new Database(dbPath);

try {
    console.log('Creating messages table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);
    console.log('Messages table created successfully (if it didn\'t exist).');

    // Verify it exists
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").get();
    console.log('Verification:', table);

} catch (error) {
    console.error('Error creating table:', error);
}
