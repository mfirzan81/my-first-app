const Database = require('better-sqlite3');
const db = new Database('app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);

const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count === 0) {
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  insert.run('Alice', 'alice@example.com');
  insert.run('Bob', 'bob@example.com');
  insert.run('Charlie', 'charlie@example.com');
}

module.exports = db;
