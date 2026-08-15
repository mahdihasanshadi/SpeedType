"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { SpeedCurveChart } from "@/components/charts/SpeedCurveChart";
import { getGuestTests, type GuestTest } from "@/lib/guest-tests";
import type { TestMode } from "@/store/typing-store";

type TestRow = {
  id?: string;
  mode: TestMode;
  target: number;
  netWpm: number;
  accuracy: number;
  createdAt: string;
};

function formatConfig(mode: TestMode, target: number) {
  return mode === "time" ? `${target}s` : `${target} words`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HistoryRow({ test }: { test: TestRow }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-body">
      <span className="text-muted-foreground">{formatDate(test.createdAt)}</span>
      <span className="font-mono text-muted-foreground">{formatConfig(test.mode, test.target)}</span>
      <span className="font-mono">{Math.round(test.netWpm)} wpm</span>
      <span className="font-mono text-muted-foreground">{test.accuracy}%</span>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-1" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function GuestHistory() {
  const [tests, setTests] = useState<GuestTest[] | null>(null);

  useEffect(() => {
    setTests(getGuestTests());
  }, []);

  if (tests === null) return <HistorySkeleton />;

  return (
    <div>
      <p className="mb-6 text-small text-muted-foreground">
        Showing tests saved on this device (last 20).{" "}
        <a href="/signup" className="text-foreground underline underline-offset-4">
          Sign up
        </a>{" "}
        to keep your history forever, synced across devices.
      </p>
      {tests.length === 0 ? (
        <p className="text-muted-foreground">No tests yet — go take one.</p>
      ) : (
        <div>
          {tests.map((t, i) => (
            <HistoryRow key={i} test={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AuthedHistory() {
  const [tests, setTests] = useState<TestRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tests?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setTests(data.tests ?? []);
        setHasMore(Boolean(data.hasMore));
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="mb-10">
        <h2 className="mb-4 text-h2">Speed curve</h2>
        <SpeedCurveChart />
      </div>

      {loading && tests === null ? (
        <HistorySkeleton />
      ) : tests && tests.length === 0 && page === 1 ? (
        <p className="text-muted-foreground">No tests yet — go take one.</p>
      ) : (
        <div>{tests?.map((t) => <HistoryRow key={t.id} test={t} />)}</div>
      )}
      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!hasMore || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { status } = useSession();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-h1">History</h1>
      {status === "loading" ? (
        <HistorySkeleton />
      ) : status === "authenticated" ? (
        <AuthedHistory />
      ) : (
        <GuestHistory />
      )}
    </main>
  );
}
