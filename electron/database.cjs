const path = require('path');
const fs = require('fs');

let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.warn('better-sqlite3 native module not compatible with this Node version, using JSON store fallback:', e.message);
}

let db = null;
let fallbackFile = null;
let fallbackData = {
  users: [
    { id: 'u1', username: 'admin', password: 'admin123', name: 'Administrator', role: 'super_admin' },
    { id: 'u2', username: 'manager', password: 'manager123', name: 'Finance Manager', role: 'finance_manager' },
    { id: 'u3', username: 'accounting', password: 'accounting123', name: 'Accounting Specialist', role: 'accounting' },
    { id: 'u4', username: 'staff', password: 'staff123', name: 'Staff Finance Operasional', role: 'finance_staff' },
    { id: 'u5', username: 'viewer', password: 'viewer123', name: 'Auditor Eksternal / Viewer', role: 'viewer' },
  ],
  store: {},
};

function getDbDir() {
  let dir;
  try {
    const electron = require('electron');
    const app = (electron && electron.app) ? electron.app : null;
    if (app && typeof app.getPath === 'function') {
      dir = app.getPath('userData');
    }
  } catch (e) {
    // Running outside Electron
  }
  if (!dir) {
    dir = path.join(__dirname, '../data');
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function initDatabase() {
  const dir = getDbDir();
  if (Database) {
    if (db) return db;
    const dbPath = path.join(dir, 'finance_data.sqlite');
    console.log('Initializing SQLite database at:', dbPath);
    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');

      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS finance_store (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );

      `);

      const defaultUsers = [
        { id: 'usr-admin', username: 'admin', password: 'admin123', name: 'Administrator', role: 'super_admin' },
        { id: 'usr-mgr', username: 'manager', password: 'manager123', name: 'Dewi Lestari (Finance Manager)', role: 'finance_manager' },
        { id: 'usr-acc', username: 'accounting', password: 'accounting123', name: 'Bambang Irawan (Accounting)', role: 'accounting' },
        { id: 'usr-stf', username: 'staff', password: 'staff123', name: 'Ahmad Faiz (Staff Finance)', role: 'finance_staff' },
        { id: 'usr-view', username: 'viewer', password: 'viewer123', name: 'Rina Kartika (Auditor / Viewer)', role: 'viewer' },
      ];

      for (const u of defaultUsers) {
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(u.username);
        if (existing) {
          db.prepare('UPDATE users SET password = ?, name = ?, role = ? WHERE id = ?').run(u.password, u.name, u.role, existing.id);
        } else {
          db.prepare('INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)').run(u.id, u.username, u.password, u.name, u.role);
        }
      }

      return db;
    } catch (err) {
      console.warn('Failed to open SQLite database, falling back to JSON file:', err.message);
      db = null;
    }
  }

  // Fallback JSON mode
  fallbackFile = path.join(dir, 'finance_fallback.json');
  if (fs.existsSync(fallbackFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
      fallbackData = { ...fallbackData, ...parsed };
    } catch (e) {
      console.error('Error reading fallback JSON:', e);
    }
  }
  return null;
}

function saveFallback() {
  if (fallbackFile) {
    try {
      fs.writeFileSync(fallbackFile, JSON.stringify(fallbackData, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving fallback JSON:', e);
    }
  }
}

function verifyUser(username, password) {
  initDatabase();
  if (db) {
    const stmt = db.prepare('SELECT id, username, name, role FROM users WHERE LOWER(username) = LOWER(?) AND password = ?');
    const user = stmt.get(username, password);
    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: `${user.username}@nabastala.com`,
        },
      };
    }
  } else {
    const user = fallbackData.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: `${user.username}@nabastala.com`,
        },
      };
    }
  }
  return { success: false, error: 'Username atau password salah.' };
}

function getAllFinanceData() {
  initDatabase();
  if (db) {
    const stmt = db.prepare('SELECT key, data FROM finance_store');
    const rows = stmt.all();
    const result = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.data);
      } catch (e) {
        console.error('Error parsing row:', row.key, e);
      }
    }
    return result;
  }
  return fallbackData.store || {};
}

function saveAllFinanceData(dataObj) {
  initDatabase();
  if (db) {
    const insertStmt = db.prepare(`
      INSERT INTO finance_store (key, data, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `);
    const transaction = db.transaction((entries) => {
      const now = Date.now();
      for (const [key, value] of entries) {
        if (value !== undefined) {
          insertStmt.run(key, JSON.stringify(value), now);
        }
      }
    });
    transaction(Object.entries(dataObj));
  } else {
    fallbackData.store = { ...fallbackData.store, ...dataObj };
    saveFallback();
  }
}

function resetStore() {
  initDatabase();
  if (db) {
    db.exec('DELETE FROM finance_store');
  } else {
    fallbackData.store = {};
    saveFallback();
  }
}

module.exports = {
  initDatabase,
  verifyUser,
  getAllFinanceData,
  saveAllFinanceData,
  resetStore,
};
