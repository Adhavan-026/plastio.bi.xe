// Electron main process for the offline desktop build.
//
// Loads the app by forking Next.js's standalone server.js (built by
// `npm run build:desktop`, see next.config.ts + scripts/prepare-desktop-build.js)
// as a child process, using Electron's own bundled Node runtime
// (ELECTRON_RUN_AS_NODE) instead of requiring a separate Node.js install on
// the end user's machine — that's the whole point of this being an .exe.
// The window just points a BrowserWindow at that local server, same as any
// other page load; no custom protocol / electron-serve needed since this is
// a real dynamic Next.js app (server actions, API routes, cookies) rather
// than something static-exportable.
//
// The SQLite database lives in app.getPath('userData') — never inside the
// install folder, which may not be writable and is wiped/replaced on
// updates/uninstall.

const { app, BrowserWindow, dialog, Menu } = require("electron");
const path = require("path");
const net = require("net");
const { fork } = require("child_process");
const { ensureDatabaseReady } = require("./db-init");

app.setName("clickOne");

const isPackaged = app.isPackaged;

// Step 6's electron-builder config copies these into resourcesPath under
// exactly these names — see docs/DESKTOP_BUILD.md.
const serverDir = isPackaged
  ? path.join(process.resourcesPath, "app")
  : path.join(__dirname, "..", ".next", "standalone");
const serverEntry = path.join(serverDir, "server.js");
const migrationsDir = isPackaged
  ? path.join(process.resourcesPath, "migrations-desktop")
  : path.join(__dirname, "..", "prisma", "migrations-desktop");

let mainWindow = null;
let serverProcess = null;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error("Timed out waiting for the local app server to start."));
        } else {
          setTimeout(tryConnect, 200);
        }
      });
    };
    tryConnect();
  });
}

// Every failure here is something a non-technical shop owner will see, so
// this always ends in a plain-language dialog instead of an unhandled
// crash / stack trace on screen.
function fatalError(title, error) {
  console.error(title, error);
  dialog.showErrorBox(title, error instanceof Error ? error.message : String(error));
  app.quit();
}

async function startServer() {
  const dbPath = path.join(app.getPath("userData"), "clickone.db");

  try {
    ensureDatabaseReady(dbPath, migrationsDir);
  } catch (error) {
    throw new Error(
      `Could not prepare the local database. Your data is safe — nothing was changed. Details: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const port = await getFreePort();

  serverProcess = fork(serverEntry, [], {
    cwd: serverDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      DEPLOYMENT_MODE: "desktop",
      DESKTOP_DB_PATH: dbPath,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  serverProcess.stdout?.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
  serverProcess.stderr?.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));
  serverProcess.on("exit", (code) => {
    serverProcess = null;
    if (code !== 0 && code !== null && mainWindow) {
      fatalError("clickOne stopped unexpectedly", new Error(`Local server exited with code ${code}.`));
    }
  });

  await waitForServer(port);
  return port;
}

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: "File", submenu: [{ role: "quit", label: "Exit" }] },
    { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }] },
  ]);
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  Menu.setApplicationMenu(buildMenu());
  mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const port = await startServer();
      createWindow(port);
    } catch (error) {
      fatalError("clickOne failed to start", error);
    }
  });

  app.on("window-all-closed", () => {
    // Windows-only installer target (NSIS/portable) — always quit fully,
    // no macOS-style "stay running in the dock" behavior to preserve.
    app.quit();
  });

  app.on("before-quit", () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });
}
