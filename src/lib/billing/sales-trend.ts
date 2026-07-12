export type DailyTrendPoint = { date: string; sales: number; purchases: number };

function sumByDay(records: { invoiceDate: Date; totalAmount: unknown }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const record of records) {
    const key = record.invoiceDate.toISOString().slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + Number(record.totalAmount));
  }
  return totals;
}

// Builds a zero-filled day-by-day series for the last `days` days (inclusive
// of today) so the chart doesn't show gaps for days with no activity.
export function buildDailyTrend(
  sales: { invoiceDate: Date; totalAmount: unknown }[],
  purchases: { invoiceDate: Date; totalAmount: unknown }[],
  days: number
): DailyTrendPoint[] {
  const salesByDay = sumByDay(sales);
  const purchasesByDay = sumByDay(purchases);

  const series: DailyTrendPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      sales: salesByDay.get(key) ?? 0,
      purchases: purchasesByDay.get(key) ?? 0,
    });
  }
  return series;
}
