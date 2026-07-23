// The cloud deployment's base URL — used by the desktop build's one
// explicit, user-triggered call out to the internet: activating a license
// key (see src/app/actions/subscription.ts). Reuses the same env var as
// email links (src/app/actions/auth.ts) so one Vercel setting covers both;
// defaults to the real production URL rather than localhost, since this
// fallback gets baked into installers handed to real customers if the var
// isn't explicitly set at desktop build time.
export const CLOUD_API_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://plastio-bi-xe.vercel.app";
