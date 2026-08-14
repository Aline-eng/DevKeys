"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  computeResult,
  createInitialState,
  isFinished,
  typingReducer,
  type TypingResult,
} from "@/lib/typing-engine";

type TypingTestProps = {
  text: string;
  onFinish: (result: TypingResult) => void;
};

export function TypingTest({ text, onFinish }: TypingTestProps) {
  const [state, dispatch] = useReducer(typingReducer, text, createInitialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  // performance.now() is impure, so it can't be called during render — it's
  // sampled here into state every 250ms instead, purely to advance the live
  // WPM display between keystrokes. Authoritative stats are computed once
  // from the full event log at FINISH, not from this ticker.
  const [liveNow, setLiveNow] = useState<number | null>(null);
  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => setLiveNow(performance.now()), 250);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status === "running" && isFinished(state)) {
      dispatch({ type: "FINISH", now: performance.now() });
    }
  }, [state]);

  useEffect(() => {
    if (state.status === "finished" && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(computeResult(state));
    }
  }, [state, onFinish]);

  function handleFocus() {
    if (state.status === "idle") {
      dispatch({ type: "START", text, now: performance.now() });
    } else if (state.status === "paused") {
      dispatch({ type: "RESUME", now: performance.now() });
    }
  }

  function handleBlur() {
    if (state.status === "running") {
      dispatch({ type: "PAUSE", now: performance.now() });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.repeat) return;

    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      dispatch({ type: "BACKSPACE", code: e.code, now: performance.now() });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      dispatch({ type: "CHAR", key: "\n", code: e.code, now: performance.now() });
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      dispatch({ type: "CHAR", key: e.key, code: e.code, now: performance.now() });
    }
  }

  const elapsedMs =
    state.elapsedMs +
    (state.segmentStart !== null && liveNow !== null
      ? Math.max(liveNow - state.segmentStart, 0)
      : 0);
  const minutes = Math.max(elapsedMs, 1) / 60000;
  let liveCorrect = 0;
  for (let i = 0; i < state.buffer.length && i < state.text.length; i++) {
    if (state.buffer[i] === state.text[i]) liveCorrect++;
  }
  const liveWpm = state.status === "running" ? Math.round(liveCorrect / 5 / minutes) : 0;

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 flex gap-6 text-sm text-zinc-500">
        <span>{liveWpm} wpm</span>
        <span>{Math.round(elapsedMs / 1000)}s</span>
      </div>

      <div
        className="relative cursor-text rounded-lg border border-zinc-200 bg-white p-6 font-mono text-lg leading-relaxed whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-900"
        onClick={() => inputRef.current?.focus()}
      >
        {text.split("").map((char, i) => {
          let className = "text-zinc-400 dark:text-zinc-600"; // untyped
          if (i < state.buffer.length) {
            className =
              state.buffer[i] === char
                ? "text-zinc-950 dark:text-zinc-50"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
          } else if (i === state.buffer.length && state.status === "running") {
            className = "text-zinc-400 dark:text-zinc-600 border-l-2 border-blue-500 animate-pulse";
          }
          return (
            <span key={i} className={className}>
              {char}
            </span>
          );
        })}

        <input
          ref={inputRef}
          autoFocus
          value=""
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          onPaste={(e) => e.preventDefault()}
          className="absolute h-0 w-0 opacity-0"
          aria-label="Typing test input"
        />

        {state.status === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/90 text-sm font-medium dark:bg-zinc-900/90">
            Click to resume
          </div>
        )}
        {state.status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/90 text-sm font-medium dark:bg-zinc-900/90">
            Click and start typing
          </div>
        )}
      </div>
    </div>
  );
}
