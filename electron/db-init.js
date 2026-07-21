// First-run (and every subsequent launch) database setup for the desktop
// build. Deliberately does NOT use Prisma's CLI/migration engine — that's a
// separate Rust binary we'd have to bundle and locate at runtime, for a
// single SQLite schema that's simple enough to apply by hand. Instead this
// runs the same .sql Prisma already generated (prisma/migrations-desktop)
// directly through better-sqlite3, tracking what's been applied in a small
// bookkeeping table of our own (not Prisma's `_prisma_migrations` table —
// we don't compute Prisma's checksums, so don't pretend to be compatible
// with `prisma migrate` tooling).
//
// Runs in the Electron MAIN process, so better-sqlite3 here must be built
// against Electron's Node ABI, not the system Node used for `npm install`
// — see docs/DESKTOP_BUILD.md's "native module rebuild" note. The forked
// Next.js server process (server.js, launched via ELECTRON_RUN_AS_NODE)
// uses the same Electron binary/ABI, so one rebuild covers both.

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function ensureDatabaseReady(dbPath, migrationsDir) {
  const db = new Database(dbPath);
  try {
    db.pragma("journal_mode = WAL");
    db.exec(
      `CREATE TABLE IF NOT EXISTS "_electron_migrations" (
         "name" TEXT PRIMARY KEY NOT NULL,
         "applied_at" TEXT NOT NULL DEFAULT (datetime('now'))
       )`
    );

    const applied = new Set(
      db.prepare(`SELECT "name" FROM "_electron_migrations"`).all().map((row) => row.name)
    );

    const pending = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !applied.has(name))
      .sort();

    for (const name of pending) {
      const sqlPath = path.join(migrationsDir, name, "migration.sql");
      const sql = fs.readFileSync(sqlPath, "utf8");
      const applyMigration = db.transaction(() => {
        db.exec(sql);
        db.prepare(`INSERT INTO "_electron_migrations" ("name") VALUES (?)`).run(name);
      });
      applyMigration();
    }
  } finally {
    db.close();
  }
}

module.exports = { ensureDatabaseReady };
