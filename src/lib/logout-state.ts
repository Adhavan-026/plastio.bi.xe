"use client";

// Shared logout coordination between the top bar's Log out button and
// SessionGuard. Marking a deliberate logout (a) silences the "Leave site?"
// warning and (b) clears the last-seen marker so the next login isn't
// mistaken for a browser that was closed without logging out.

export const LAST_SEEN_KEY = "plastio-last-seen";

let loggingOut = false;

export function markLoggingOut() {
  loggingOut = true;
  try {
    localStorage.removeItem(LAST_SEEN_KEY);
  } catch {
    // localStorage unavailable — nothing to clean.
  }
}

export function isLoggingOut() {
  return loggingOut;
}

// Called when the dashboard mounts: logout redirects are client-side
// navigations, so the flag would otherwise stay set after re-login.
export function resetLoggingOut() {
  loggingOut = false;
}
