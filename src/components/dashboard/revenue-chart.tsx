"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyTrendPoint } from "@/lib/billing/sales-trend";

const chartConfig = {
  sales: {
    label: "Total Sales",
    color: "var(--chart-1)",
  },
  purchases: {
    label: "Total Purchases",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function compactInr(v: number): string {
  return `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
}

export function RevenueChart({ data }: { data: DailyTrendPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-purchases)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-purchases)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tickFormatter={(v: number) => compactInr(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              }
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {name === "sales" ? "Sales" : "Purchases"}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    ₹{Number(value).toFixed(2)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="purchases"
          type="monotone"
          fill="url(#fillPurchases)"
          stroke="var(--color-purchases)"
          strokeWidth={2}
        />
        <Area
          dataKey="sales"
          type="monotone"
          fill="url(#fillSales)"
          stroke="var(--color-sales)"
          strokeWidth={2.5}
        />
      </AreaChart>
    </ChartContainer>
  );
}
