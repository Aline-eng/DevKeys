"use client";

import { useMemo, useState } from "react";
import { KEYBOARD_ROWS, normalizeKeyForHeatmap } from "@/lib/keyboard-layout";

export type KeyStat = {
  key: string;
  attemptsCount: number;
  correctCount: number;
  incorrectCount: number;
  errorRate: number;
  avgLatencyMs: number | null;
};

type MergedStat = {
  attemptsCount: number;
  incorrectCount: number;
  errorRate: number;
  avgLatencyMs: number | null;
};

// Sequential blue ramp (light -> dark = low -> high error rate), matching
// the app's dataviz palette. Light/dark hexes are validated separately
// (validate_palette.js --ordinal) since each mode's ramp end must clear
// 2:1 contrast against its own page surface — a single shared ramp fails
// that check at one end or the other.
const BUCKETS: { max: number; fillClass: string; ink: "dark" | "light" }[] = [
  { max: 0, fillClass: "bg-[#86b6ef] dark:bg-[#b7d3f6]", ink: "dark" },
  { max: 0.05, fillClass: "bg-[#5598e7] dark:bg-[#6da7ec]", ink: "dark" },
  { max: 0.15, fillClass: "bg-[#2a78d6] dark:bg-[#3987e5]", ink: "light" },
  { max: 0.3, fillClass: "bg-[#1c5cab] dark:bg-[#256abf]", ink: "light" },
  { max: Infinity, fillClass: "bg-[#104281] dark:bg-[#184f95]", ink: "light" },
];

function bucketFor(errorRate: number) {
  return BUCKETS.find((b) => errorRate <= b.max) ?? BUCKETS[BUCKETS.length - 1];
}

export function KeyboardHeatmap({ keys }: { keys: KeyStat[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const merged = useMemo(() => {
    const map = new Map<string, MergedStat & { latencySum: number; latencyCount: number }>();
    for (const k of keys) {
      const base = normalizeKeyForHeatmap(k.key);
      const entry = map.get(base) ?? {
        attemptsCount: 0,
        incorrectCount: 0,
        errorRate: 0,
        avgLatencyMs: null,
        latencySum: 0,
        latencyCount: 0,
      };
      entry.attemptsCount += k.attemptsCount;
      entry.incorrectCount += k.incorrectCount;
      if (k.avgLatencyMs !== null) {
        entry.latencySum += k.avgLatencyMs * k.attemptsCount;
        entry.latencyCount += k.attemptsCount;
      }
      map.set(base, entry);
    }
    const result = new Map<string, MergedStat>();
    for (const [base, v] of map) {
      result.set(base, {
        attemptsCount: v.attemptsCount,
        incorrectCount: v.incorrectCount,
        errorRate: v.attemptsCount > 0 ? v.incorrectCount / v.attemptsCount : 0,
        avgLatencyMs: v.latencyCount > 0 ? v.latencySum / v.latencyCount : null,
      });
    }
    return result;
  }, [keys]);

  const selectedStat = selected ? merged.get(selected) : null;

  return (
    <div>
      <div className="mb-3 flex h-10 items-center text-sm text-zinc-500">
        {selected && selectedStat ? (
          <span>
            <span className="font-mono font-semibold text-zinc-950 dark:text-zinc-50">
              {selected === " " ? "space" : selected}
            </span>{" "}
            · {selectedStat.attemptsCount} presses · {Math.round(selectedStat.errorRate * 100)}%
            error rate
            {selectedStat.avgLatencyMs !== null && (
              <> · {Math.round(selectedStat.avgLatencyMs)}ms avg</>
            )}
          </span>
        ) : (
          <span>Hover a key to see its stats.</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            {row.map((k) => {
              const stat = merged.get(k.base);
              const hasData = stat && stat.attemptsCount > 0;
              const bucket = hasData ? bucketFor(stat.errorRate) : null;

              return (
                <button
                  key={k.base}
                  type="button"
                  onMouseEnter={() => setSelected(k.base)}
                  onFocus={() => setSelected(k.base)}
                  className={`flex h-10 items-center justify-center rounded-md border font-mono text-xs transition-transform hover:scale-105 ${
                    k.width ? "flex-[8]" : "flex-1"
                  } ${
                    hasData
                      ? `${bucket!.fillClass} border-black/10 ${
                          bucket!.ink === "light" ? "text-white" : "text-zinc-950"
                        }`
                      : "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-600"
                  }`}
                >
                  {k.width ? "" : k.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
