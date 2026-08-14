import { Router } from "express";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { typingAttempts, keystrokeEvents, keyStats, practiceTexts } from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";
import { attemptSubmitLimiter } from "../middleware/rate-limit.js";

export const attemptsRouter = Router();

attemptsRouter.use(requireAuth);

const keystrokeSchema = z.object({
  seq: z.number().int().min(0),
  timestampMs: z.number().int().min(0),
  key: z.string().min(1).max(16),
  code: z.string().min(1).max(32),
  expectedChar: z.string().max(8).nullable(),
  isCorrect: z.boolean(),
  eventType: z.enum(["char", "backspace"]),
  interKeyIntervalMs: z.number().int().min(0).nullable(),
});

const submitAttemptSchema = z.object({
  practiceTextId: z.string().uuid(),
  durationMs: z.number().int().min(1),
  wpm: z.number().min(0),
  rawWpm: z.number().min(0),
  accuracyPct: z.number().min(0).max(100),
  totalChars: z.number().int().min(1),
  correctChars: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  uncorrectedErrorCount: z.number().int().min(0),
  keystrokes: z.array(keystrokeSchema).min(1).max(20000),
  clientMeta: z.record(z.string(), z.unknown()).optional(),
});

attemptsRouter.post("/", attemptSubmitLimiter, async (req, res) => {
  const parsed = submitAttemptSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid attempt payload", issues: parsed.error.issues });
  }
  const body = parsed.data;
  const userId = req.user!.id;

  const practiceText = await db.query.practiceTexts.findFirst({
    where: eq(practiceTexts.id, body.practiceTextId),
  });
  if (!practiceText) {
    return res.status(404).json({ message: "Practice text not found" });
  }

  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - body.durationMs);

  // Aggregate per-key totals for this submission; key_stats is upserted
  // incrementally below so the dashboard heatmap never has to scan the
  // full keystroke_events history to render.
  const perKey = new Map<
    string,
    { attempts: number; correct: number; incorrect: number; latencySum: number; latencyCount: number }
  >();
  for (const k of body.keystrokes) {
    if (k.eventType !== "char") continue;
    const entry = perKey.get(k.key) ?? {
      attempts: 0,
      correct: 0,
      incorrect: 0,
      latencySum: 0,
      latencyCount: 0,
    };
    entry.attempts += 1;
    if (k.isCorrect) entry.correct += 1;
    else entry.incorrect += 1;
    if (k.interKeyIntervalMs !== null) {
      entry.latencySum += k.interKeyIntervalMs;
      entry.latencyCount += 1;
    }
    perKey.set(k.key, entry);
  }

  const attempt = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(typingAttempts)
      .values({
        userId,
        practiceTextId: body.practiceTextId,
        startedAt,
        completedAt,
        durationMs: body.durationMs,
        wpm: body.wpm,
        rawWpm: body.rawWpm,
        accuracyPct: body.accuracyPct,
        totalChars: body.totalChars,
        correctChars: body.correctChars,
        errorCount: body.errorCount,
        uncorrectedErrorCount: body.uncorrectedErrorCount,
        clientMeta: body.clientMeta ?? null,
      })
      .returning();

    await tx.insert(keystrokeEvents).values(
      body.keystrokes.map((k) => ({
        attemptId: inserted.id,
        seq: k.seq,
        timestampMs: k.timestampMs,
        key: k.key,
        code: k.code,
        expectedChar: k.expectedChar,
        isCorrect: k.isCorrect,
        eventType: k.eventType,
        interKeyIntervalMs: k.interKeyIntervalMs,
      })),
    );

    if (perKey.size > 0) {
      const rows = Array.from(perKey.entries()).map(([key, v]) => ({
        userId,
        key,
        attemptsCount: v.attempts,
        correctCount: v.correct,
        incorrectCount: v.incorrect,
        avgLatencyMs: v.latencyCount > 0 ? v.latencySum / v.latencyCount : null,
        lastPracticedAt: completedAt,
      }));

      await tx
        .insert(keyStats)
        .values(rows)
        .onConflictDoUpdate({
          target: [keyStats.userId, keyStats.key],
          set: {
            attemptsCount: sql`${keyStats.attemptsCount} + excluded.attempts_count`,
            correctCount: sql`${keyStats.correctCount} + excluded.correct_count`,
            incorrectCount: sql`${keyStats.incorrectCount} + excluded.incorrect_count`,
            avgLatencyMs: sql`(COALESCE(${keyStats.avgLatencyMs}, 0) * ${keyStats.attemptsCount} + COALESCE(excluded.avg_latency_ms, 0) * excluded.attempts_count) / (${keyStats.attemptsCount} + excluded.attempts_count)`,
            lastPracticedAt: sql`excluded.last_practiced_at`,
          },
        });
    }

    return inserted;
  });

  res.status(201).json({ attempt });
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.coerce.number().int().min(0).optional(),
});

attemptsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query params", issues: parsed.error.issues });
  }
  const { limit, cursor } = parsed.data;

  const rows = await db.query.typingAttempts.findMany({
    where: eq(typingAttempts.userId, req.user!.id),
    orderBy: desc(typingAttempts.completedAt),
    limit,
    offset: cursor ?? 0,
    with: { practiceText: true },
  });

  res.json({ attempts: rows });
});

attemptsRouter.get("/:id", async (req, res) => {
  const row = await db.query.typingAttempts.findFirst({
    where: eq(typingAttempts.id, req.params.id),
    with: { practiceText: true },
  });

  if (!row || row.userId !== req.user!.id) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  res.json({ attempt: row });
});
