export const PAGE_SIZE = 20;

export function resolvePage(params: { page?: string }): number {
  const page = Number(params.page);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function totalPages(count: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}
