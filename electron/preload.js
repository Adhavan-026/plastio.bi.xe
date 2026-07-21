// Runs in an isolated context with access to Node APIs, but the renderer
// (the Next.js app itself) never gets nodeIntegration — it only sees
// whatever's explicitly exposed here. Kept to read-only, non-sensitive
// values for now; Step 5 (backup/restore) adds the first real bridge
// methods (invoking ipcMain handlers in electron/main.js), also here.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clickOne", {
  isDesktop: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version ?? null,
});

void ipcRenderer; // reserved for Step 5's backup/restore bridge methods
