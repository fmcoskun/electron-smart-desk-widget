const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  minimize: () => ipcRenderer.send('window:minimize'),
  hide: () => ipcRenderer.send('window:hide'),
  togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
  resize: (height) => ipcRenderer.send('window:resize', height),
});
