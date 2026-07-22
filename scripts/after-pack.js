// electron-builder afterPack hook (see electron-builder.yml's `afterPack`).
// Reverses scripts/rename-for-packaging.js's rename inside the packaged
// output, where Node's require() needs the real "node_modules" name to
// resolve the forked server's dependencies at runtime.

const fs = require("fs");
const path = require("path");
const { retryFsOp } = require("./retry-fs");

module.exports = async function afterPack(context) {
  const serverDir = path.join(context.appOutDir, "resources", "nextjs-server");
  const renamed = path.join(serverDir, "_node_modules");
  const restored = path.join(serverDir, "node_modules");

  if (!fs.existsSync(renamed)) {
    console.warn("after-pack: _node_modules not found in packaged output — nothing to restore.");
    return;
  }

  const label = "after-pack";
  await retryFsOp(() => fs.rmSync(restored, { recursive: true, force: true }), { label });
  await retryFsOp(() => fs.renameSync(renamed, restored), { label });
  console.log("after-pack: _node_modules -> node_modules (restored inside packaged app)");
};
