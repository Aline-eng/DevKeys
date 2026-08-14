"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { apiFetch } from "@/lib/api";
import { TrendChart, type TrendPoint } from "@/components/dashboard/trend-chart";
import { KeyboardHeatmap, type KeyStat } from "@/components/dashboard/keyboard-heatmap";
import { WeeklyReportCard, type WeeklyReport } from "@/components/dashboard/weekly-report";

type Overview = {
  totalAttempts: number;
  avgWpm: number;
  avgAccuracyPct: number;
  bestWpm: number;
  totalPracticeTimeMs: number;
  trend: TrendPoint[];
};

type AttemptHistoryItem = {
  id: string;
  wpm: number;
  accuracyPct: number;
  completedAt: string;
  practiceText: { title: string; category: string };
};

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [keys, setKeys] = useState<KeyStat[]>([]);
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiFetch<Overview>("/api/stats/overview"),
      apiFetch<{ keys: KeyStat[] }>("/api/stats/keys"),
      apiFetch<{ attempts: AttemptHistoryItem[] }>("/api/attempts?limit=10"),
      apiFetch<WeeklyReport>("/api/stats/weekly-report"),
    ])
      .then(([overviewData, keysData, attemptsData, weeklyReportData]) => {
        if (ignore) return;
        setOverview(overviewData);
        setKeys(keysData.keys);
        setAttempts(attemptsData.attempts);
        setWeeklyReport(weeklyReportData);
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load your stats. Is the API running?");
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 flex-col px-6 py-16">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {overview && overview.totalAttempts === 0 ? (
        <p className="text-sm text-zinc-500">
          No practice sessions yet.{" "}
          <a href="/practice" className="font-medium text-zinc-950 dark:text-zinc-50">
            Start practicing
          </a>{" "}
          to see your stats here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Avg WPM" value={overview?.avgWpm ?? "—"} />
            <StatTile label="Best WPM" value={overview?.bestWpm ?? "—"} />
            <StatTile label="Avg accuracy" value={overview ? `${overview.avgAccuracyPct}%` : "—"} />
            <StatTile label="Sessions" value={overview?.totalAttempts ?? "—"} />
          </div>

          {weeklyReport && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">This week</h2>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <WeeklyReportCard report={weeklyReport} />
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">WPM over time</h2>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <TrendChart data={overview?.trend ?? []} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Weak keys</h2>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <KeyboardHeatmap keys={keys} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Recent sessions</h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                    <th className="px-4 py-2 font-medium">Text</th>
                    <th className="px-4 py-2 font-medium">WPM</th>
                    <th className="px-4 py-2 font-medium">Accuracy</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                      <td className="px-4 py-2">{a.practiceText.title}</td>
                      <td className="px-4 py-2 tabular-nums">{a.wpm}</td>
                      <td className="px-4 py-2 tabular-nums">{a.accuracyPct}%</td>
                      <td className="px-4 py-2 text-zinc-500">
                        {new Date(a.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
