"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Row = { party: string; paid: number; due: number };

const chartConfig = {
  paid: { label: "Paid", color: "var(--chart-3)" },
  due: { label: "Due", color: "var(--chart-4)" },
} satisfies ChartConfig;

function truncate(value: string, max = 18): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function TopPartiesChart({ rows }: { rows: Row[] }) {
  const data = rows.slice(0, 8).reverse();
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold">Top parties by revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <YAxis
              dataKey="party"
              type="category"
              tickLine={false}
              axisLine={false}
              width={130}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => truncate(v)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
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
            <Bar dataKey="paid" stackId="rev" fill="var(--color-paid)" radius={[2, 0, 0, 2]} />
            <Bar dataKey="due" stackId="rev" fill="var(--color-due)" radius={[0, 2, 2, 0]} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
