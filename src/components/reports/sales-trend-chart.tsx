"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Row = { date: string; revenue: number; profit: number };

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  profit: { label: "Profit", color: "var(--chart-2)" },
} satisfies ChartConfig;

function compactInr(v: number): string {
  return `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
}

export function SalesTrendChart({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold">Daily sales trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={rows}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
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
                    new Date(value).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  }
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        ₹{Number(value).toFixed(2)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
            />
            <Area dataKey="profit" type="monotone" fill="url(#fillProfit)" stroke="var(--color-profit)" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
