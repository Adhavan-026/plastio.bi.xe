// Windows antivirus real-time scanning briefly locks freshly-written or
// freshly-renamed files/folders, which can make fs operations fail with
// EPERM/EBUSY even though nothing is actually wrong — it clears up on its
// own within a second or two. Shared retry helper for the packaging
// scripts that rename .next/standalone/node_modules around electron-builder
// (see rename-for-packaging.js and after-pack.js for why that's needed).

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryFsOp(op, { attempts = 8, delayMs = 750, label = "fs operation" } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      op();
      return;
    } catch (error) {
      const transient = error && (error.code === "EPERM" || error.code === "EBUSY");
      if (!transient || attempt === attempts) throw error;
      console.warn(
        `${label}: ${error.code} (attempt ${attempt}/${attempts}), retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }
}

module.exports = { retryFsOp };
