const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let win;
let tray;

function createWindow() {
  win = new BrowserWindow({
    width: 470,
    height: 760,
    useContentSize: true,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    hasShadow: false,
    show: false,
    title: 'Smart Desk Hub',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // Close button hides to tray; real quit happens from the tray menu
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  // 16x16 green dot (BGRA bitmap) so we don't depend on an icon file
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      const i = (y * size + x) * 4;
      if (d <= 7) buf.set([0x3c, 0xb3, 0x00, 0xff], i);
    }
  }
  const icon = nativeImage.createFromBitmap(buf, { width: size, height: size });
  tray = new Tray(icon);
  tray.setToolTip('Smart Desk Hub');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Göster', click: () => win.show() },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()));
}

ipcMain.on('window:minimize', () => win.minimize());
ipcMain.on('window:hide', () => win.hide());
ipcMain.handle('window:toggle-pin', () => {
  const pinned = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(pinned);
  return pinned;
});
ipcMain.on('window:resize', (_e, height) => {
  const [width] = win.getContentSize();
  win.setContentSize(width, Math.ceil(height));
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => win && win.show());
  app.whenReady().then(() => {
    createWindow();
    createTray();
  });
}

app.on('before-quit', () => (app.isQuitting = true));
