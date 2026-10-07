const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, verifyUser, getAllFinanceData, saveAllFinanceData } = require('./database.cjs');
const { startServer } = require('./server.cjs');

let mainWindow = null;

async function createWindow() {
  const iconPath = path.join(__dirname, '../src/assets/faicon.ico');
  mainWindow = new BrowserWindow({
    icon: iconPath,
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Nebula Finance - PT Nabastala',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
  });

  // Start Express Server
  const serverUrl = await startServer(3000);

  // In development, we can still load Vite dev server for HMR
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devServerUrl).catch(() => {
      mainWindow.loadURL(serverUrl);
    });
  } else {
    mainWindow.loadURL(serverUrl);
  }

  // Remove the default menu for a cleaner look
  mainWindow.setMenuBarVisibility(false);
}

// Register IPC Handlers
ipcMain.handle('login', async (event, credentials) => {
  return verifyUser(credentials.username, credentials.password);
});

ipcMain.handle('getFinanceData', async () => {
  return getAllFinanceData();
});

ipcMain.handle('saveFinanceData', async (event, data) => {
  saveAllFinanceData(data);
  return { success: true };
});

app.whenReady().then(() => {
  // Initialize SQLite Database before creating window
  initDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
