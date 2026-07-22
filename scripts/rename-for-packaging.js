// electron-builder hardcodes an exclusion for any directory literally
// named "node_modules" directly under an extraResources `from` path — see
// createFilter() in node_modules/app-builder-lib/out/util/filter.js:
//   // filter the root node_modules, but not a sub node_modules
//   if (relative === "node_modules") { return false; }
// There's no config option to disable this (confirmed by reading the
// source and reproducing it in isolation), so .next/standalone/node_modules
// — needed to actually run server.js — gets silently dropped during
// packaging even with an explicit `filter: ["**/*"]`.
//
// Renaming it first sidesteps the exact-string check; electron-builder.yml's
// afterPack hook (scripts/after-pack.js) renames it back inside the
// packaged output, where Node's require() needs the real "node_modules"
// name to resolve anything at runtime.
//
// This rename is transient by design: the next `npm run build:desktop`
// (next build clears .next first) regenerates a fresh, correctly-named
// node_modules, so there's nothing to "undo" if a build step is skipped.
//
// Run automatically as part of `npm run package:desktop`, after
// rebuild-standalone-native.js.

const fs = require("fs");
const path = require("path");
const { retryFsOp } = require("./retry-fs");

const standaloneDir = path.join(__dirname, "..", ".next", "standalone");
const nodeModules = path.join(standaloneDir, "node_modules");
const renamed = path.join(standaloneDir, "_node_modules");

async function main() {
  if (!fs.existsSync(nodeModules)) {
    console.error(
      "rename-for-packaging: .next/standalone/node_modules not found — run build:desktop first."
    );
    process.exit(1);
  }

  const label = "rename-for-packaging";
  await retryFsOp(() => fs.rmSync(renamed, { recursive: true, force: true }), { label });
  await retryFsOp(() => fs.renameSync(nodeModules, renamed), { label });
  console.log("rename-for-packaging: node_modules -> _node_modules (temporary, for packaging only)");
}

main().catch((error) => {
  console.error("rename-for-packaging: failed —", error);
  process.exit(1);
});
