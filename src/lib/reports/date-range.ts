function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolves a from/to date range from URL search params, defaulting to the
 * last `defaultDays` days when not provided. `to` is normalized to the end
 * of that day so the range is inclusive.
 */
export function resolveDateRange(
  params: { from?: string; to?: string },
  defaultDays = 30
): { from: Date; to: Date; fromStr: string; toStr: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - (defaultDays - 1));

  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(params.to) : today;
  to.setHours(23, 59, 59, 999);

  return { from, to, fromStr: toDateStr(from), toStr: toDateStr(to) };
}
