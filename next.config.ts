import type { NextConfig } from "next";

// Only the desktop build packages a standalone server.js (bundled into the
// Electron app so it can run without a separate Node/npm install on the
// end user's machine). Left unset for cloud: Vercel has its own optimized
// output pipeline and explicitly recommends NOT setting `output: standalone`
// there — this must never activate unless DEPLOYMENT_MODE=desktop was set
// at build time, same gate as prisma.config.ts and src/lib/deployment-mode.ts.
const isDesktop = process.env.DEPLOYMENT_MODE === "desktop";

const nextConfig: NextConfig = {
  ...(isDesktop ? { output: "standalone" } : {}),
};

export default nextConfig;
