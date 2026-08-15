"use client";

import { useEffect, useState } from "react";

type Summary = {
  personalBestWpm: number | null;
  avgWpm: number | null;
  avgAccuracy: number | null;
  totalTests: number;
  currentStreak: number;
};

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-h2">{value}</div>
      <div className="text-stat-label text-muted-foreground">{label}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="mb-10 h-14 w-full animate-pulse rounded-md bg-muted" aria-hidden />;
}

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/tests/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Summary | null) => {
        // Only accept a well-formed summary — an error shape ({error: string}) or a failed
        // fetch leaves the skeleton up rather than crashing on a missing field.
        if (data && typeof data.totalTests === "number") setSummary(data);
      })
      .catch(() => {});
  }, []);

  if (!summary) return <DashboardSkeleton />;

  return (
    <div className="mb-10 flex flex-wrap gap-x-10 gap-y-4">
      <Tile
        value={summary.personalBestWpm !== null ? String(Math.round(summary.personalBestWpm)) : "—"}
        label="personal best"
      />
      <Tile value={summary.avgWpm !== null ? String(Math.round(summary.avgWpm)) : "—"} label="avg wpm" />
      <Tile
        value={summary.avgAccuracy !== null ? `${summary.avgAccuracy.toFixed(1)}%` : "—"}
        label="avg accuracy"
      />
      <Tile value={String(summary.totalTests)} label="tests taken" />
      <Tile value={String(summary.currentStreak)} label="day streak" />
    </div>
  );
}
