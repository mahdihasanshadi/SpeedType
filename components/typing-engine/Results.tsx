import { Button } from "@/components/ui/button";
import type { TestResult } from "@/store/typing-store";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-mono text-stat">{value}</div>
      <div className="text-stat-label text-muted-foreground">{label}</div>
    </div>
  );
}

function BreakdownItem({
  value,
  label,
  colorClass,
}: {
  value: number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-mono text-h3 ${colorClass}`}>{value}</span>
      <span className="text-small text-muted-foreground">{label}</span>
    </div>
  );
}

export function Results({
  result,
  onNextTest,
  isGuest,
}: {
  result: TestResult;
  onNextTest: () => void;
  isGuest?: boolean;
}) {
  return (
    <div className="mt-10 flex animate-in flex-col gap-8 fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-6">
        <Stat value={Math.round(result.netWpm)} label="wpm" />
        <Stat value={Math.round(result.rawWpm)} label="raw" />
        <Stat value={`${result.accuracy}%`} label="accuracy" />
        <Stat value={`${result.consistency}%`} label="consistency" />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <BreakdownItem value={result.charStats.correct} label="correct" colorClass="text-foreground" />
        <BreakdownItem
          value={result.charStats.incorrect}
          label="incorrect"
          colorClass="text-destructive"
        />
        <BreakdownItem value={result.charStats.extra} label="extra" colorClass="text-warning" />
        <BreakdownItem
          value={result.charStats.missed}
          label="missed"
          colorClass="text-muted-foreground"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={onNextTest}>
          Next test
        </Button>
        {isGuest && (
          <p className="text-small text-muted-foreground">
            <a href="/signup" className="text-foreground underline underline-offset-4">
              Sign up
            </a>{" "}
            to keep this — and every test — in your speed curve forever.
          </p>
        )}
      </div>
    </div>
  );
}
