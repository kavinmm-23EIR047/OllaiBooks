const { contextBridge, ipcRenderer } = require('electron');

// Narrow, typed bridge — the web page can only ask for these file actions,
// and the main process decides the folder (Documents/ollaiBooks/<Business>).
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  printReceipt: () => ipcRenderer.send('print-receipt'),
  getPaths: (business) => ipcRenderer.invoke('ob:get-paths', String(business || '')),
  saveInvoiceFile: (input) => ipcRenderer.invoke('ob:save-invoice', {
    html: String(input?.html || ''),
    fileName: String(input?.fileName || ''),
    business: String(input?.business || ''),
    date: input?.date ? String(input.date) : undefined,
  }),
  saveBackupFile: (input) => ipcRenderer.invoke('ob:save-backup', {
    json: String(input?.json || ''),
    fileName: String(input?.fileName || ''),
    business: String(input?.business || ''),
  }),
  listBackups: (business) => ipcRenderer.invoke('ob:list-backups', String(business || '')),
  openFolder: (target, business) => ipcRenderer.invoke('ob:open-folder', ['invoices', 'backups', 'root'].includes(target) ? target : 'root', String(business || '')),
});
