"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { TypingResult } from "@/lib/typing-engine";
import { TypingTest } from "@/components/practice/typing-test";

type PracticeText = {
  id: string;
  title: string;
  body: string;
  category: "code" | "prose" | "quote";
  difficulty: number;
};

export default function PracticePage() {
  const { data: session } = useSession();
  const [current, setCurrent] = useState<PracticeText | null>(null);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  function handleFinish(finishedResult: TypingResult, practiceTextId: string) {
    setResult(finishedResult);
    setSaveError(null);

    if (!session) return;

    apiFetch("/api/attempts", {
      method: "POST",
      body: JSON.stringify({
        practiceTextId,
        durationMs: finishedResult.durationMs,
        wpm: finishedResult.wpm,
        rawWpm: finishedResult.rawWpm,
        accuracyPct: finishedResult.accuracyPct,
        totalChars: finishedResult.totalChars,
        correctChars: finishedResult.correctChars,
        errorCount: finishedResult.errorCount,
        uncorrectedErrorCount: finishedResult.uncorrectedErrorCount,
        keystrokes: finishedResult.events,
      }),
    }).catch(() => {
      setSaveError("Couldn't save this result, but here's how you did:");
    });
  }

  function loadNext() {
    setError(null);
    setResult(null);
    apiFetch<{ texts: PracticeText[] }>("/api/texts?limit=20")
      .then((data) => {
        if (data.texts.length === 0) {
          setError("No practice texts available yet.");
          return;
        }
        const pick = data.texts[Math.floor(Math.random() * data.texts.length)];
        setCurrent(pick);
        setKey((k) => k + 1);
      })
      .catch(() => {
        setError("Couldn't load a practice text. Is the API running?");
      });
  }

  // Effect fetches directly (rather than calling loadNext) so no setState
  // runs synchronously in the effect body — only inside the .then callback.
  useEffect(() => {
    let ignore = false;
    apiFetch<{ texts: PracticeText[] }>("/api/texts?limit=20")
      .then((data) => {
        if (ignore || data.texts.length === 0) return;
        const pick = data.texts[Math.floor(Math.random() * data.texts.length)];
        setCurrent(pick);
        setKey((k) => k + 1);
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load a practice text. Is the API running?");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Practice</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {current && !result && (
        <>
          <p className="mb-6 text-sm text-zinc-500">
            {current.title} · {current.category}
          </p>
          <TypingTest
            key={key}
            text={current.body}
            onFinish={(r) => handleFinish(r, current.id)}
          />
          {!session && (
            <p className="mt-4 text-sm text-zinc-500">
              <a href="/sign-up" className="font-medium text-zinc-950 dark:text-zinc-50">
                Sign up
              </a>{" "}
              to save your results and track your progress over time.
            </p>
          )}
        </>
      )}

      {result && (
        <div className="w-full max-w-3xl rounded-lg border border-zinc-200 p-8 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-semibold">Results</h2>
          {saveError && <p className="mb-4 text-sm text-amber-600">{saveError}</p>}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="WPM" value={result.wpm} />
            <Stat label="Raw WPM" value={result.rawWpm} />
            <Stat label="Accuracy" value={`${result.accuracyPct}%`} />
            <Stat label="Errors" value={result.errorCount} />
          </div>
          <button
            onClick={loadNext}
            className="mt-6 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Next text
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
