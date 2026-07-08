export function getWarrantyExpiry(saleDate: Date, warrantyMonths: number): Date {
  const expiry = new Date(saleDate);
  expiry.setMonth(expiry.getMonth() + warrantyMonths);
  return expiry;
}

export function isWarrantyValid(saleDate: Date, warrantyMonths: number | null): boolean {
  if (!warrantyMonths || warrantyMonths <= 0) return false;
  return getWarrantyExpiry(saleDate, warrantyMonths).getTime() >= Date.now();
}
