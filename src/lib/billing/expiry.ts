const WARNING_WINDOW_DAYS = 30;

export type ExpiryStatus = "expired" | "expiring_soon" | "ok" | "none";

export function getExpiryStatus(expiryDate: Date | null): ExpiryStatus {
  if (!expiryDate) return "none";
  const daysLeft = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "expired";
  if (daysLeft <= WARNING_WINDOW_DAYS) return "expiring_soon";
  return "ok";
}
