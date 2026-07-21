// Runs in an isolated context with access to Node APIs, but the renderer
// (the Next.js app itself) never gets nodeIntegration — it only sees
// whatever's explicitly exposed here. Every method below just invokes an
// ipcMain handler in electron/main.js / electron/backup.js; the renderer
// never touches the filesystem or dialogs directly.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clickOne", {
  isDesktop: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version ?? null,
  backup: () => ipcRenderer.invoke("backup:create"),
  restore: () => ipcRenderer.invoke("backup:restore"),
  getLastBackupInfo: () => ipcRenderer.invoke("backup:last-info"),
  relaunch: () => ipcRenderer.invoke("app:relaunch"),
});
