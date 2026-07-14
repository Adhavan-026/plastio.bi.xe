"use client";

import { useEffect } from "react";
import { logout } from "@/app/actions/auth";
import {
  isLoggingOut,
  markLoggingOut,
  resetLoggingOut,
  LAST_SEEN_KEY,
} from "@/lib/logout-state";

// How long the app can be "unseen" before we treat the browser as having
// been closed and force a fresh login. Open tabs ping every PING_MS (and on
// tab close), so only a real close (or crash) lets the timestamp go stale.
const STALE_MS = 90_000;
const PING_MS = 20_000;

export function SessionGuard() {
  useEffect(() => {
    resetLoggingOut();
    const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
    if (lastSeen && Date.now() - lastSeen > STALE_MS) {
      // Browser was closed without logging out — end the old session.
      markLoggingOut();
      void logout();
      return;
    }

    const ping = () => {
      if (!isLoggingOut()) {
        localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
      }
    };
    ping();
    const interval = setInterval(ping, PING_MS);

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isLoggingOut()) return;
      // Record when the browser/tab was closed, and ask "Leave site?" so
      // people use the Log out button (which saves their backup) instead.
      ping();
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}
