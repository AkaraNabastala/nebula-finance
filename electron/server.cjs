const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, verifyUser, getAllFinanceData, saveAllFinanceData, resetStore } = require('./database.cjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize SQLite database
initDatabase();

// API: Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password wajib diisi.' });
  }
  const result = verifyUser(username, password);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// API: Get all finance data from SQLite
app.get('/api/finance/data', (req, res) => {
  try {
    const data = getAllFinanceData();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching finance data:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data dari database.' });
  }
});

// API: Save / sync finance data to SQLite
app.post('/api/finance/data', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload data tidak valid.' });
    }
    saveAllFinanceData(data);
    res.json({ success: true, message: 'Data berhasil disinkronkan ke SQLite.' });
  } catch (err) {
    console.error('Error saving finance data:', err);
    res.status(500).json({ success: false, error: 'Gagal menyimpan data ke database.' });
  }
});

// API: Reset finance data to default
app.post('/api/finance/reset', (req, res) => {
  try {
    resetStore();
    res.json({ success: true, message: 'Database berhasil di-reset.' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ success: false, error: 'Gagal mereset database.' });
  }
});

// Serve static files from React build if available
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for React Router (Single Page Application)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

let serverInstance = null;

function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      return resolve(`http://localhost:${port}`);
    }
    serverInstance = app.listen(port, '0.0.0.0', () => {
      console.log(`Finance Server running on http://0.0.0.0:${port}`);
      resolve(`http://localhost:${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, using existing running server.`);
        resolve(`http://localhost:${port}`);
      } else {
        reject(err);
      }
    });
  });
}

// Standalone execution support: node electron/server.cjs
if (require.main === module) {
  startServer(process.env.PORT || 3000);
}

module.exports = { app, startServer };
