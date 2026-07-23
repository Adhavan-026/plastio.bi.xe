import { CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlagshipFeature = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  tint: string;
};

// Large alternating image+copy row for a headline feature — the "hero
// treatment" a handful of flagship features get, vs. the compact grid the
// rest of the feature list uses (src/app/page.tsx). The visual panel reuses
// this app's existing icon-on-a-soft-blur-card language (see
// DashboardMockup in page.tsx) rather than photography, which this app
// doesn't have any of.
export function FeatureShowcaseRow({
  item,
  reversed = false,
}: {
  item: FlagshipFeature;
  reversed?: boolean;
}) {
  const copy = (
    <div>
      <span className="text-primary text-xs font-bold tracking-wide uppercase">{item.eyebrow}</span>
      <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h3>
      <p className="text-muted-foreground mt-3 text-base">{item.description}</p>
      <ul className="mt-5 flex flex-col gap-2.5">
        {item.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm font-medium">
            <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );

  const visual = (
    <div className="relative flex justify-center">
      <div className={cn("absolute -z-10 size-64 rounded-full blur-3xl", item.tint)} />
      <div className="bg-card flex aspect-4/3 w-full max-w-md items-center justify-center rounded-2xl border shadow-xl">
        <item.icon className="text-primary size-20" strokeWidth={1.25} />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {reversed ? (
        <>
          {visual}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {visual}
        </>
      )}
    </div>
  );
}
