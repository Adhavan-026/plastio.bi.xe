// next build with `output: "standalone"` emits .next/standalone/server.js
// but deliberately excludes `public/` and `.next/static/` (meant to be
// served by a CDN in a normal deployment). There is no CDN here — this
// copies both into the standalone folder so server.js can serve everything
// on its own, exactly as documented in
// node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md.
//
// Run automatically at the end of `npm run build:desktop`.

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error(
    "prepare-desktop-build: .next/standalone not found — did next build run with DEPLOYMENT_MODE=desktop?"
  );
  process.exit(1);
}

fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});

console.log("prepare-desktop-build: copied public/ and .next/static/ into .next/standalone/");
