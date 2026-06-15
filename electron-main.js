// 🌳 情绪树洞 - Electron 主进程
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = spawn('node', [serverPath], {
    stdio: 'pipe',
    cwd: __dirname
  });
  serverProcess.stdout.on('data', data => {
    console.log(`[树洞] ${data}`);
  });
  serverProcess.stderr.on('data', data => {
    console.error(`[树洞] ${data}`);
  });
  serverProcess.on('close', code => {
    console.log(`[树洞] 服务退出 (code: ${code})`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 750,
    resizable: true,
    title: '🌳 情绪树洞',
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 等服务器启动后加载
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3457');
  }, 2000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
