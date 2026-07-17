import { cn } from "@/lib/utils";

// Full wordmark — wide lockup, for headers/panels with room to breathe.
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading inline-flex items-center gap-0.5 text-xl leading-none font-bold tracking-tight whitespace-nowrap",
        className
      )}
    >
      <span className="text-primary">Click</span>
      <span className="text-foreground">One</span>
    </span>
  );
}

// Icon-only mark — square badge, for tight spaces (collapsed sidebar, avatars).
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground font-heading inline-flex items-center justify-center rounded-lg text-sm font-bold",
        className
      )}
    >
      C1
    </span>
  );
}
