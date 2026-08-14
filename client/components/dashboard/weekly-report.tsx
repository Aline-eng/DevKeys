export type WeeklyReport = {
  thisWeek: { sessions: number; avgWpm: number; avgAccuracyPct: number };
  wpmDelta: number | null;
  accuracyDelta: number | null;
  topWeakKeys: { key: string; errorRatePct: number }[];
};

// Status colors (good/critical) already clear 3:1 contrast on both light
// and dark surfaces per the palette, so no dark: variant is needed here.
function Delta({ value, unit }: { value: number | null; unit: string }) {
  if (value === null) {
    return <span className="text-sm text-zinc-500">no data last week</span>;
  }
  if (value === 0) {
    return <span className="text-sm text-zinc-500">▬ no change</span>;
  }
  const isUp = value > 0;
  return (
    <span className={`text-sm font-medium ${isUp ? "text-[#0ca30c]" : "text-[#d03b3b]"}`}>
      {isUp ? "▲" : "▼"} {isUp ? "+" : ""}
      {value}
      {unit} vs last week
    </span>
  );
}

export function WeeklyReportCard({ report }: { report: WeeklyReport }) {
  if (report.thisWeek.sessions === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No sessions yet this week — practice a few times to get a weekly report.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{report.thisWeek.sessions}</div>
          <div className="text-xs text-zinc-500">sessions this week</div>
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight">{report.thisWeek.avgWpm}</div>
          <div className="text-xs text-zinc-500">avg wpm</div>
          <Delta value={report.wpmDelta} unit="" />
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight">{report.thisWeek.avgAccuracyPct}%</div>
          <div className="text-xs text-zinc-500">avg accuracy</div>
          <Delta value={report.accuracyDelta} unit="%" />
        </div>
      </div>

      {report.topWeakKeys.length > 0 && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Focus on:{" "}
          {report.topWeakKeys.map((k, i) => (
            <span key={k.key}>
              <span className="font-mono font-semibold text-zinc-950 dark:text-zinc-50">
                {k.key === " " ? "space" : k.key}
              </span>{" "}
              ({k.errorRatePct}% error){i < report.topWeakKeys.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
