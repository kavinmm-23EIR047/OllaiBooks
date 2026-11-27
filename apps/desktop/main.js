const { app, BrowserWindow, Menu, shell, utilityProcess, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

/* ------------------------------------------------------------------ */
/* Local files: every invoice + backup is saved in a clear, visible     */
/* folder on the laptop:  Documents/ollaiBooks/<Business>/...          */
/* ------------------------------------------------------------------ */

const MONTHS = ['01-Jan', '02-Feb', '03-Mar', '04-Apr', '05-May', '06-Jun', '07-Jul', '08-Aug', '09-Sep', '10-Oct', '11-Nov', '12-Dec'];
const MAX_HTML_BYTES = 8 * 1024 * 1024;
const MAX_BACKUP_BYTES = 200 * 1024 * 1024;
const KEEP_BACKUPS = 30;

function safeSegment(value, fallback) {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9 _.()-]/g, '').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, 60);
  return cleaned || fallback;
}

function dataPaths(business) {
  const root = path.join(app.getPath('documents'), 'ollaiBooks', safeSegment(business, 'My Business'));
  return {
    root,
    invoices: path.join(root, 'Invoices'),
    backups: path.join(root, 'Backups'),
    appData: app.getPath('userData'),
    appVersion: app.getVersion(),
  };
}

function ensureInside(base, target) {
  const rel = path.relative(base, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Refusing to write outside the ollaiBooks folder');
}

async function htmlToPdf(html, outFile) {
  const tmp = path.join(app.getPath('temp'), `ollaibooks-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  const win = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true, contextIsolation: true } });
  try {
    await win.loadFile(tmp);
    const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { marginType: 'default' } });
    fs.writeFileSync(outFile, pdf);
  } finally {
    win.destroy();
    fs.rm(tmp, { force: true }, () => {});
  }
}

function registerFileHandlers() {
  ipcMain.handle('ob:get-paths', (_e, business) => dataPaths(business));

  ipcMain.handle('ob:save-invoice', async (_e, input) => {
    try {
      if (!input || typeof input.html !== 'string' || Buffer.byteLength(input.html) > MAX_HTML_BYTES) throw new Error('Invalid invoice');
      const paths = dataPaths(input.business);
      const when = input.date ? new Date(input.date) : new Date();
      const dir = path.join(paths.invoices, String(when.getFullYear()), MONTHS[when.getMonth()]);
      const file = path.join(dir, `${safeSegment(String(input.fileName || 'invoice').replace(/\.pdf$/i, ''), 'invoice')}.pdf`);
      ensureInside(paths.root, file);
      fs.mkdirSync(dir, { recursive: true });
      await htmlToPdf(input.html, file);
      return { ok: true, path: file };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('ob:save-backup', async (_e, input) => {
    try {
      if (!input || typeof input.json !== 'string' || Buffer.byteLength(input.json) > MAX_BACKUP_BYTES) throw new Error('Invalid backup');
      const paths = dataPaths(input.business);
      fs.mkdirSync(paths.backups, { recursive: true });
      const file = path.join(paths.backups, `${safeSegment(String(input.fileName || 'backup').replace(/\.json$/i, ''), 'backup')}.json`);
      ensureInside(paths.root, file);
      fs.writeFileSync(file, input.json, 'utf8');
      // Keep the newest backups only, so the laptop never fills up
      const old = fs.readdirSync(paths.backups)
        .filter((n) => n.endsWith('.json'))
        .map((n) => ({ n, t: fs.statSync(path.join(paths.backups, n)).mtimeMs }))
        .sort((a, b) => b.t - a.t)
        .slice(KEEP_BACKUPS);
      old.forEach(({ n }) => fs.rmSync(path.join(paths.backups, n), { force: true }));
      return { ok: true, path: file };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('ob:list-backups', (_e, business) => {
    const { backups } = dataPaths(business);
    if (!fs.existsSync(backups)) return [];
    return fs.readdirSync(backups)
      .filter((n) => n.endsWith('.json'))
      .map((n) => { const s = fs.statSync(path.join(backups, n)); return { name: n, size: s.size, modifiedAt: s.mtime.toISOString() }; })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  });

  ipcMain.handle('ob:open-folder', async (_e, target, business) => {
    const paths = dataPaths(business);
    const dir = target === 'invoices' ? paths.invoices : target === 'backups' ? paths.backups : paths.root;
    fs.mkdirSync(dir, { recursive: true });
    const err = await shell.openPath(dir);
    return { ok: !err };
  });
}

let mainWindow;
let posServer;
let posUrlPromise;
const POS_PORT = 32147;

function verifyPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => server.close((error) => error ? reject(error) : resolve(port)));
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.setTimeout(1500, () => request.destroy());
      request.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) reject(new Error('The bundled offline POS server did not start.'));
        else setTimeout(check, 300);
      });
    };
    check();
  });
}

async function getPosUrl() {
  if (!app.isPackaged) return process.env.POS_URL || 'http://localhost:3000/offline-pos';
  if (posUrlPromise) return posUrlPromise;

  posUrlPromise = (async () => {
    await verifyPortAvailable(POS_PORT);
    const serverPath = path.join(__dirname, 'pos-server', 'apps', 'web', 'server.js');
    posServer = utilityProcess.fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: String(POS_PORT) },
      stdio: 'pipe',
    });
    posServer.on('exit', (code) => {
      if (code && app.isReady()) console.error(`Offline POS server exited with code ${code}.`);
    });

    const localUrl = `http://127.0.0.1:${POS_PORT}/offline-pos`;
    await waitForServer(localUrl);
    return localUrl;
  })();
  return posUrlPromise;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ollaiBooks',
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

  getPosUrl().then((targetUrl) => mainWindow && mainWindow.loadURL(targetUrl)).catch((err) => {
    console.error('Could not start the offline POS.', err.message);
    if (!mainWindow) return;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head><title>ollaiBooks Offline POS</title>
        <style>body{background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}a{color:#38bdf8;text-decoration:none}</style>
        </head>
        <body>
          <div>
            <h1>ollaiBooks Offline POS Desktop</h1>
            <p>The bundled POS could not start. Please reinstall the desktop app.</p>
          </div>
        </body>
        </html>
      `)}`);
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
          label: 'ollaiBooks Support (WhatsApp)',
          click: async () => shell.openExternal('https://wa.me/919600732162'),
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

const hasAppLock = app.requestSingleInstanceLock();
if (!hasAppLock) app.quit();

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  if (!hasAppLock) return;
  registerFileHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (posServer && !posServer.killed) posServer.kill();
});
