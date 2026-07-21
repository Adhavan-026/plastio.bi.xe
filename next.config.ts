import type { NextConfig } from "next";

// Only the desktop build packages a standalone server.js (bundled into the
// Electron app so it can run without a separate Node/npm install on the
// end user's machine). Left unset for cloud: Vercel has its own optimized
// output pipeline and explicitly recommends NOT setting `output: standalone`
// there — this must never activate unless DEPLOYMENT_MODE=desktop was set
// at build time, same gate as prisma.config.ts and src/lib/deployment-mode.ts.
const isDesktop = process.env.DEPLOYMENT_MODE === "desktop";

const nextConfig: NextConfig = {
  ...(isDesktop
    ? {
        output: "standalone",
        // Next's output file tracing statically analyzes require()/import
        // calls to decide what to copy — it can't follow the dynamic
        // require() that better-sqlite3's `bindings` loader uses to find
        // its prebuilt binary, so without this it only copies
        // better-sqlite3's package.json, silently dropping lib/, build/,
        // and prebuilds/ entirely. Confirmed by inspecting
        // .next/standalone/node_modules/better-sqlite3 after a real build.
        outputFileTracingIncludes: {
          "/*": [
            "node_modules/better-sqlite3/**/*",
            "node_modules/bindings/**/*",
            "node_modules/file-uri-to-path/**/*",
          ],
        },
      }
    : {}),
};

export default nextConfig;
