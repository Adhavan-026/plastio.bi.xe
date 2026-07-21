// The desktop build touches SQLite from two separate processes: the
// Electron main process (electron/db-init.js, electron/backup.js) and the
// forked Next.js server (via @prisma/adapter-better-sqlite3), which also
// runs under Electron's own Node runtime (ELECTRON_RUN_AS_NODE). Both need
// better-sqlite3's native binary rebuilt against Electron's Node ABI, not
// the system Node used for `npm install`.
//
// electron-builder automatically rebuilds native modules inside the app's
// own packaged node_modules (see electron-builder.yml's `files`), but NOT
// this separate copy that `next build`'s output tracing bundled into
// .next/standalone/node_modules for the forked server — that one has to be
// rebuilt here, by hand, before packaging.
//
// Run automatically as part of `npm run package:desktop`.

const path = require("path");
const { rebuild } = require("@electron/rebuild");
const electronVersion = require("electron/package.json").version;

const buildPath = path.join(__dirname, "..", ".next", "standalone");

rebuild({ buildPath, electronVersion, force: true })
  .then(() => {
    console.log(
      `rebuild-standalone-native: better-sqlite3 rebuilt for Electron ${electronVersion}`
    );
  })
  .catch((error) => {
    console.error("rebuild-standalone-native: failed —", error);
    process.exit(1);
  });
