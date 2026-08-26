const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow = null;
let tray = null;
let serverProcess = null;

const PORT = 3456;

// Start internal background server
function startServer() {
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = fork(serverPath, ['--tunnel'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: PORT }
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    title: 'AetherDrop ✦ PC & Telefon Işınlama Platformu',
    backgroundColor: '#07090e',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load local URL with retry
  const loadApp = () => {
    mainWindow.loadURL(`http://localhost:${PORT}`).catch(() => {
      setTimeout(loadApp, 800);
    });
  };

  setTimeout(loadApp, 1000);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    // When closing, minimize to tray instead of quitting if tray exists
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

// Setup System Tray Icon (Bottom right near clock)
function createTray() {
  try {
    // 16x16 icon svg data URL or generated icon
    const icon = nativeImage.createFromBuffer(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA0SURBVDhPY/wPBAwUACYGkgE0NYxEN2AEuQGbhhGphkEZMBrdgE3DiFTDoAwYjW4gqBsIBgAh5gcvv4hX7QAAAABJRU5ErkJggg==',
        'base64'
      )
    );
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: '🛸 AetherDrop Aç', click: () => mainWindow.show() },
      { type: 'separator' },
      {
        label: 'Çıkış Yap',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setToolTip('AetherDrop - PC to Phone Teleport');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
  } catch (e) {
    console.error('Tray creation failed:', e);
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
