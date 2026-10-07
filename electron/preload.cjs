const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  getFinanceData: () => ipcRenderer.invoke('getFinanceData'),
  saveFinanceData: (data) => ipcRenderer.invoke('saveFinanceData', data),
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});
