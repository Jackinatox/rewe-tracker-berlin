"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRating } from "@/lib/ratings";

export interface MonthPoint {
  key: string;
  label: string;
  visits: number;
  avg: number | null;
}

const axis = { stroke: "var(--color-muted)", fontSize: 11, tickLine: false, axisLine: false } as const;

function ChartTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { payload: MonthPoint; value: number | null }[];
  format: (p: MonthPoint) => string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-ink">{point.label}</div>
      <div className="text-ink-2">{format(point)}</div>
    </div>
  );
}

export function VisitsPerMonthChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} {...axis} />
          <Tooltip
            cursor={{ fill: "var(--color-surface-2)" }}
            content={<ChartTooltip format={(p) => `${p.visits} ${p.visits === 1 ? "Besuch" : "Besuche"}`} />}
          />
          <Bar dataKey="visits" fill="var(--color-series)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatingTrendChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} {...axis} />
          <Tooltip
            cursor={{ stroke: "var(--color-baseline)" }}
            content={
              <ChartTooltip format={(p) => (p.avg == null ? "Keine Besuche" : `Ø ${formatRating(p.avg)} Sterne`)} />
            }
          />
          <Line
            dataKey="avg"
            stroke="var(--color-series)"
            strokeWidth={2}
            connectNulls
            dot={{ r: 4, fill: "var(--color-series)", stroke: "var(--color-surface)", strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: "var(--color-surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
