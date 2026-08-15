"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { rollingAverage } from "@/lib/rolling-average";
import type { TestMode } from "@/store/typing-store";

type ModeFilter = TestMode | "all";
type RangeFilter = "7" | "30" | "90" | "all";

type ChartPoint = {
  date: string;
  label: string;
  netWpm: number;
  rollingAvg: number;
};

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-small text-popover-foreground shadow-sm">
      <div className="text-muted-foreground">{point.label}</div>
      <div className="font-mono">{Math.round(point.netWpm)} wpm</div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse rounded-md bg-muted" aria-hidden />
  );
}

export function SpeedCurveChart() {
  const [mode, setMode] = useState<ModeFilter>("all");
  const [range, setRange] = useState<RangeFilter>("30");
  const [points, setPoints] = useState<ChartPoint[] | null>(null);

  useEffect(() => {
    setPoints(null);
    const params = new URLSearchParams({ pageSize: "200", range });
    if (mode !== "all") params.set("mode", mode);

    fetch(`/api/tests?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        type Row = { netWpm: number; createdAt: string };
        const rows: Row[] = data.tests ?? [];
        const ascending = [...rows].reverse(); // API returns newest-first; chart wants oldest-first
        const netWpms = ascending.map((r) => r.netWpm);
        const avgs = rollingAverage(netWpms, 10);

        setPoints(
          ascending.map((r, i) => ({
            date: r.createdAt,
            label: new Date(r.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            netWpm: Math.round(r.netWpm),
            rollingAvg: Math.round(avgs[i]),
          })),
        );
      });
  }, [mode, range]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill active={mode === "all"} onClick={() => setMode("all")}>
          all modes
        </Pill>
        <Pill active={mode === "time"} onClick={() => setMode("time")}>
          time
        </Pill>
        <Pill active={mode === "words"} onClick={() => setMode("words")}>
          words
        </Pill>

        <span className="mx-1 h-4 w-px bg-border" />

        <Pill active={range === "7"} onClick={() => setRange("7")}>
          7d
        </Pill>
        <Pill active={range === "30"} onClick={() => setRange("30")}>
          30d
        </Pill>
        <Pill active={range === "90"} onClick={() => setRange("90")}>
          90d
        </Pill>
        <Pill active={range === "all"} onClick={() => setRange("all")}>
          all
        </Pill>
      </div>

      {points === null ? (
        <ChartSkeleton />
      ) : points.length === 0 ? (
        <div className="flex h-64 w-full items-center justify-center rounded-md border border-border text-muted-foreground">
          No tests in this range yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              stroke="var(--fg-muted)"
              tick={{ fill: "var(--fg-muted)", fontSize: 12 }}
            />
            <YAxis stroke="var(--fg-muted)" tick={{ fill: "var(--fg-muted)", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="netWpm"
              stroke="var(--accent-color)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--accent-color)" }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke="var(--fg-muted)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
