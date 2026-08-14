"use client";

import { useRef, useState } from "react";

export type TrendPoint = {
  date: string;
  avgWpm: number;
  avgAccuracyPct: number;
  attempts: number;
};

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 20, right: 16, bottom: 28, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-zinc-500">
        Practice a few more days to see your trend.
      </div>
    );
  }

  const niceMax = Math.max(10, Math.ceil((Math.max(...data.map((d) => d.avgWpm)) * 1.15) / 10) * 10);

  const xFor = (i: number) => PAD.left + (i / (data.length - 1)) * PLOT_W;
  const yFor = (v: number) => PAD.top + PLOT_H - (v / niceMax) * PLOT_H;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)},${yFor(d.avgWpm)}`).join(" ");
  const ticks = [0, niceMax / 2, niceMax];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.round(((relX - PAD.left) / PLOT_W) * (data.length - 1));
    setHoverIndex(Math.min(Math.max(idx, 0), data.length - 1));
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative aspect-[600/220] w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full text-[#2a78d6] dark:text-[#3987e5]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={yFor(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-500 text-[10px]"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        <path d={pathD} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <circle
            key={d.date}
            cx={xFor(i)}
            cy={yFor(d.avgWpm)}
            r={hoverIndex === i ? 6 : 4}
            fill="currentColor"
            className="stroke-white dark:stroke-zinc-900"
            strokeWidth={2}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            className="stroke-zinc-300 dark:stroke-zinc-700"
            strokeWidth={1}
          />
        )}

        <text x={PAD.left} y={HEIGHT - 6} className="fill-zinc-500 text-[10px]">
          {data[0].date}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-zinc-500 text-[10px]">
          {data[data.length - 1].date}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          style={{
            left: `${(xFor(hoverIndex!) / WIDTH) * 100}%`,
            top: `${(yFor(hovered.avgWpm) / HEIGHT) * 100}%`,
          }}
        >
          <div className="font-medium text-zinc-950 dark:text-zinc-50">{hovered.date}</div>
          <div className="text-zinc-500">
            {hovered.avgWpm} wpm · {hovered.avgAccuracyPct}% · {hovered.attempts} attempt
            {hovered.attempts === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
