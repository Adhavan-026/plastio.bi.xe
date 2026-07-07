export function isLowStock(stockQty: unknown, lowStockAlert: unknown): boolean {
  return Number(stockQty) <= Number(lowStockAlert);
}
