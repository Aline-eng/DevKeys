export type KeystrokeEventType = "char" | "backspace";

export type KeystrokeEvent = {
  seq: number;
  timestampMs: number;
  key: string;
  code: string;
  expectedChar: string | null;
  isCorrect: boolean;
  eventType: KeystrokeEventType;
  interKeyIntervalMs: number | null;
};

export type TypingStatus = "idle" | "running" | "paused" | "finished";

export type TypingState = {
  status: TypingStatus;
  text: string;
  buffer: string;
  events: KeystrokeEvent[];
  startedAt: number | null; // performance.now() at first START
  segmentStart: number | null; // performance.now() when the current running segment began
  elapsedMs: number; // accumulated active time across segments, excluding the current one
  lastEventAt: number | null; // performance.now() of the previous event, for inter-key interval
};

export type TypingAction =
  | { type: "START"; text: string; now: number }
  | { type: "CHAR"; key: string; code: string; now: number }
  | { type: "BACKSPACE"; code: string; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number }
  | { type: "FINISH"; now: number }
  | { type: "RESET" };

export function createInitialState(text: string): TypingState {
  return {
    status: "idle",
    text,
    buffer: "",
    events: [],
    startedAt: null,
    segmentStart: null,
    elapsedMs: 0,
    lastEventAt: null,
  };
}

export function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "START": {
      if (state.status === "running") return state;
      return {
        ...createInitialState(action.text),
        status: "running",
        startedAt: action.now,
        segmentStart: action.now,
      };
    }

    case "CHAR": {
      if (state.status !== "running") return state;
      const cursor = state.buffer.length;
      const expectedChar = cursor < state.text.length ? state.text[cursor] : null;
      const isCorrect = expectedChar !== null && action.key === expectedChar;

      const event: KeystrokeEvent = {
        seq: state.events.length,
        timestampMs: Math.round(action.now - (state.startedAt ?? action.now)),
        key: action.key,
        code: action.code,
        expectedChar,
        isCorrect,
        eventType: "char",
        interKeyIntervalMs:
          state.lastEventAt !== null ? Math.round(action.now - state.lastEventAt) : null,
      };

      const buffer = state.buffer + action.key;

      return {
        ...state,
        buffer,
        events: [...state.events, event],
        lastEventAt: action.now,
      };
    }

    case "BACKSPACE": {
      if (state.status !== "running" || state.buffer.length === 0) return state;

      const event: KeystrokeEvent = {
        seq: state.events.length,
        timestampMs: Math.round(action.now - (state.startedAt ?? action.now)),
        key: "Backspace",
        code: action.code,
        expectedChar: null,
        isCorrect: false,
        eventType: "backspace",
        interKeyIntervalMs:
          state.lastEventAt !== null ? Math.round(action.now - state.lastEventAt) : null,
      };

      return {
        ...state,
        buffer: state.buffer.slice(0, -1),
        events: [...state.events, event],
        lastEventAt: action.now,
      };
    }

    case "PAUSE": {
      if (state.status !== "running") return state;
      return {
        ...state,
        status: "paused",
        elapsedMs: state.elapsedMs + (action.now - (state.segmentStart ?? action.now)),
        segmentStart: null,
      };
    }

    case "RESUME": {
      if (state.status !== "paused") return state;
      return {
        ...state,
        status: "running",
        segmentStart: action.now,
      };
    }

    case "FINISH": {
      if (state.status !== "running") return state;
      return {
        ...state,
        status: "finished",
        elapsedMs: state.elapsedMs + (action.now - (state.segmentStart ?? action.now)),
        segmentStart: null,
      };
    }

    case "RESET": {
      return createInitialState(state.text);
    }

    default:
      return state;
  }
}

export type TypingResult = {
  durationMs: number;
  wpm: number;
  rawWpm: number;
  accuracyPct: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  uncorrectedErrorCount: number;
  events: KeystrokeEvent[];
};

export function computeResult(state: TypingState): TypingResult {
  const durationMs = Math.max(state.elapsedMs, 1);
  const minutes = durationMs / 60000;

  let correctChars = 0;
  for (let i = 0; i < state.text.length && i < state.buffer.length; i++) {
    if (state.buffer[i] === state.text[i]) correctChars++;
  }
  const totalChars = state.text.length;
  const errorCount = totalChars - correctChars;

  const charEvents = state.events.filter((e) => e.eventType === "char");
  const uncorrectedErrorCount = charEvents.filter((e) => !e.isCorrect).length;

  const wpm = correctChars / 5 / minutes;
  const rawWpm = charEvents.length / 5 / minutes;
  const accuracyPct = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;

  return {
    durationMs: Math.round(durationMs),
    wpm: Math.round(wpm * 10) / 10,
    rawWpm: Math.round(rawWpm * 10) / 10,
    accuracyPct: Math.round(accuracyPct * 10) / 10,
    totalChars,
    correctChars,
    errorCount,
    uncorrectedErrorCount,
    events: state.events,
  };
}

export function isFinished(state: TypingState): boolean {
  return state.buffer.length >= state.text.length;
}
