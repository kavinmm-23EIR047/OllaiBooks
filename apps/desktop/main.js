const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ollaiBooks Universal POS (Offline Counter)',
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  const targetUrl = process.env.POS_URL || 'http://localhost:3000/offline-pos';

  // Attempt to load the live or cached offline POS URL
  mainWindow.loadURL(targetUrl).catch((err) => {
    console.warn('Could not connect to live port, loading local offline fallback...', err.message);
    const fallbackPath = path.join(__dirname, 'offline-pos.standalone.html');
    mainWindow.loadFile(fallbackPath).catch(() => {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head><title>ollaiBooks Offline POS</title>
        <style>body{background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}a{color:#38bdf8;text-decoration:none}</style>
        </head>
        <body>
          <div>
            <h1>ollaiBooks Offline POS Desktop</h1>
            <p>Please start the local server with <code>npm run dev</code> or open the standalone offline HTML file.</p>
            <p><a href="http://localhost:3000/offline-pos" onclick="location.reload();return false;">🔄 Retry Connection</a></p>
          </div>
        </body>
        </html>
      `)}`);
    });
  });

  // Native window menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Bill (Ctrl+N)',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.executeJavaScript('window.location.hash = "#new-bill"'),
        },
        {
          label: 'Print Receipt (Ctrl+P)',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.print({ silent: false, printBackground: true }),
        },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Kiosk Mode (Billing Counter)',
          accelerator: 'F11',
          click: () => mainWindow.setKiosk(!mainWindow.isKiosk()),
        },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'ollaiBooks Documentation',
          click: async () => shell.openExternal('https://github.com'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
