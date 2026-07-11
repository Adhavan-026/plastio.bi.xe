"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyTotal } from "@/lib/billing/sales-trend";

const chartConfig = {
  total: {
    label: "Sales",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function compactInr(v: number): string {
  return `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
}

export function RevenueChart({ data }: { data: DailyTotal[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
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
              formatter={(value) => `₹${Number(value).toFixed(2)}`}
            />
          }
        />
        <Area
          dataKey="total"
          type="monotone"
          fill="url(#fillTotal)"
          stroke="var(--color-total)"
          strokeWidth={2.5}
        />
      </AreaChart>
    </ChartContainer>
  );
}
