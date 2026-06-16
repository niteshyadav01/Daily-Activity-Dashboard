const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'dashboard.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', DB_PATH);
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Employees table
    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT NOT NULL UNIQUE,
        department TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        selected_count INTEGER DEFAULT 0,
        cycle_number INTEGER DEFAULT 1,
        last_selected_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity history table
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_date TEXT NOT NULL,
        employee_id INTEGER NOT NULL,
        employee_name TEXT NOT NULL,
        department TEXT NOT NULL,
        cycle INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    // Daily activity generation log (to prevent duplicates same day)
    db.run(`
      CREATE TABLE IF NOT EXISTS activity_generation_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        generation_date TEXT UNIQUE NOT NULL,
        count_generated INTEGER DEFAULT 4,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Insert default settings if not exists
      db.run(`
        INSERT OR IGNORE INTO settings (setting_key, setting_value)
        VALUES ('daily_selection_count', '4')
      `);
    });

    console.log('Database tables initialized successfully');
  });
}

module.exports = db;
