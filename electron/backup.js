// Backup/restore for the desktop build's SQLite database. Runs entirely in
// the main process (file dialogs + filesystem access) and is exposed to the
// renderer only through the narrow bridge in electron/preload.js — the
// Next.js app itself never touches these files directly.

const { ipcMain, dialog, app } = require("electron");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A non-SQLite file (or an unrelated .db file) either fails to open at all
// or is missing the tables every clickOne database has — either way, this
// throws or returns false rather than letting a bad file get copied over
// the user's real data.
function isClickOneDatabase(filePath) {
  const db = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const tables = new Set(
      db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
        .all()
        .map((row) => row.name)
    );
    return tables.has("Tenant") && tables.has("User");
  } finally {
    db.close();
  }
}

function registerBackupHandlers({ getDbPath, getBackupsDir, getMainWindow, killServer }) {
  fs.mkdirSync(getBackupsDir(), { recursive: true });

  ipcMain.handle("backup:create", async () => {
    const dbPath = getDbPath();
    const defaultPath = path.join(getBackupsDir(), `clickone-backup-${todayStamp()}.db`);

    const { canceled, filePath } = await dialog.showSaveDialog(getMainWindow(), {
      title: "Backup clickOne data",
      defaultPath,
      filters: [{ name: "clickOne Backup", extensions: ["db"] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    try {
      // WAL mode means the most recent commits can still be sitting in
      // clickone.db-wal rather than the main file — checkpoint first so
      // copying just the main file captures a complete, consistent backup.
      const liveDb = new Database(dbPath);
      liveDb.pragma("wal_checkpoint(TRUNCATE)");
      liveDb.close();

      fs.copyFileSync(dbPath, filePath);
      return { ok: true, path: filePath };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("backup:restore", async () => {
    const dbPath = getDbPath();
    const backupsDir = getBackupsDir();

    const { canceled, filePaths } = await dialog.showOpenDialog(getMainWindow(), {
      title: "Restore clickOne data",
      defaultPath: backupsDir,
      filters: [{ name: "clickOne Backup", extensions: ["db"] }],
      properties: ["openFile"],
    });
    if (canceled || filePaths.length === 0) return { ok: false, canceled: true };
    const sourcePath = filePaths[0];

    try {
      let valid;
      try {
        valid = isClickOneDatabase(sourcePath);
      } catch {
        valid = false;
      }
      if (!valid) {
        return {
          ok: false,
          error: "That file doesn't look like a clickOne backup — nothing was changed.",
        };
      }

      fs.mkdirSync(backupsDir, { recursive: true });
      const safetyPath = path.join(backupsDir, `pre-restore-safety-${Date.now()}.db`);
      fs.copyFileSync(dbPath, safetyPath);

      // The running server holds the live db open — stop it before touching
      // the file on disk, so nothing writes to it mid-swap and no stale
      // -wal/-shm from the OLD file gets replayed against the restored one.
      killServer();

      for (const suffix of ["-wal", "-shm"]) {
        const sidecar = dbPath + suffix;
        if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
      }
      fs.copyFileSync(sourcePath, dbPath);

      return { ok: true, safetyBackupPath: safetyPath };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // No new DB column for "last backup time" — derived from the backup
  // files' own filesystem timestamps in the default backups folder.
  // (A backup saved somewhere else, like a USB drive, won't show up here;
  // that's an acceptable tradeoff for not tracking this in the database.)
  ipcMain.handle("backup:last-info", () => {
    try {
      const files = fs
        .readdirSync(getBackupsDir())
        .filter((name) => /^clickone-backup-.*\.db$/.test(name))
        .map((name) => {
          const full = path.join(getBackupsDir(), name);
          return { name, mtime: fs.statSync(full).mtimeMs };
        });
      if (files.length === 0) return { lastBackupAt: null };
      files.sort((a, b) => b.mtime - a.mtime);
      return { lastBackupAt: new Date(files[0].mtime).toISOString() };
    } catch {
      return { lastBackupAt: null };
    }
  });

  ipcMain.handle("app:relaunch", () => {
    app.relaunch();
    app.exit(0);
  });
}

module.exports = { registerBackupHandlers };
