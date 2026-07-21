export {};

// Injected by electron/preload.js — only ever present when running inside
// the packaged desktop app, never in the cloud build's browser tab.
declare global {
  interface Window {
    clickOne?: {
      isDesktop: true;
      platform: string;
      appVersion: string | null;
      backup: () => Promise<{ ok: boolean; canceled?: boolean; path?: string; error?: string }>;
      restore: () => Promise<{
        ok: boolean;
        canceled?: boolean;
        safetyBackupPath?: string;
        error?: string;
      }>;
      getLastBackupInfo: () => Promise<{ lastBackupAt: string | null }>;
      relaunch: () => Promise<void>;
    };
  }
}
