"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type Row = { name: string; sellingValue: number };

const chartConfig = {
  sellingValue: { label: "Stock value", color: "var(--chart-2)" },
} satisfies ChartConfig;

function truncate(value: string, max = 18): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function StockValueChart({ rows }: { rows: Row[] }) {
  // The table stays sorted alphabetically; the chart wants highest-value first.
  const data = [...rows]
    .sort((a, b) => b.sellingValue - a.sellingValue)
    .slice(0, 8)
    .reverse();
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold">Top products by stock value</CardTitle>
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
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={130}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => truncate(v)}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => `₹${Number(value).toFixed(2)}`} />}
            />
            <Bar dataKey="sellingValue" fill="var(--color-sellingValue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
