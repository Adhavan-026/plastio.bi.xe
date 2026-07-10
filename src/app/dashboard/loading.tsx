import { Loader2 } from "lucide-react";

// Next.js shows this instantly on navigation into any /dashboard/* route
// while that route's server component is still fetching data, so a slow
// query reads as "loading" instead of a frozen page. Sidebar/header stay
// mounted — only this content area swaps in.
export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-[60vh] flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5 opacity-60 blur-[2px] sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card h-28 animate-pulse rounded-xl border" />
        ))}
      </div>
      <div className="bg-card h-64 animate-pulse rounded-xl border opacity-60 blur-[2px]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card/90 flex items-center gap-2.5 rounded-full border px-5 py-2.5 shadow-lg">
          <Loader2 className="text-primary size-4 animate-spin" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    </div>
  );
}
