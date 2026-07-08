export type DailyTotal = { date: string; total: number };

// Builds a zero-filled day-by-day series for the last `days` days (inclusive
// of today) so the chart doesn't show gaps for days with no sales.
export function buildDailySalesTrend(
  invoices: { invoiceDate: Date; totalAmount: unknown }[],
  days: number
): DailyTotal[] {
  const totalsByDay = new Map<string, number>();
  for (const invoice of invoices) {
    const key = invoice.invoiceDate.toISOString().slice(0, 10);
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + Number(invoice.totalAmount));
  }

  const series: DailyTotal[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, total: totalsByDay.get(key) ?? 0 });
  }
  return series;
}
