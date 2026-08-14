import { Router } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { typingAttempts, keyStats } from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get("/overview", async (req, res) => {
  const userId = req.user!.id;

  const [summary] = await db
    .select({
      totalAttempts: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(avg(${typingAttempts.wpm}), 0)::float8`,
      avgAccuracyPct: sql<number>`coalesce(avg(${typingAttempts.accuracyPct}), 0)::float8`,
      bestWpm: sql<number>`coalesce(max(${typingAttempts.wpm}), 0)::float8`,
      totalPracticeTimeMs: sql<number>`coalesce(sum(${typingAttempts.durationMs}), 0)::float8`,
    })
    .from(typingAttempts)
    .where(eq(typingAttempts.userId, userId));

  const trend = await db
    .select({
      date: sql<string>`to_char(${typingAttempts.completedAt}, 'YYYY-MM-DD')`,
      avgWpm: sql<number>`avg(${typingAttempts.wpm})::float8`,
      avgAccuracyPct: sql<number>`avg(${typingAttempts.accuracyPct})::float8`,
      attempts: sql<number>`count(*)::int`,
    })
    .from(typingAttempts)
    .where(
      and(
        eq(typingAttempts.userId, userId),
        gte(typingAttempts.completedAt, sql`now() - interval '14 days'`),
      ),
    )
    .groupBy(sql`to_char(${typingAttempts.completedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${typingAttempts.completedAt}, 'YYYY-MM-DD')`);

  res.json({
    totalAttempts: summary?.totalAttempts ?? 0,
    avgWpm: Math.round((summary?.avgWpm ?? 0) * 10) / 10,
    avgAccuracyPct: Math.round((summary?.avgAccuracyPct ?? 0) * 10) / 10,
    bestWpm: Math.round((summary?.bestWpm ?? 0) * 10) / 10,
    totalPracticeTimeMs: summary?.totalPracticeTimeMs ?? 0,
    trend: trend.map((t) => ({
      date: t.date,
      avgWpm: Math.round(t.avgWpm * 10) / 10,
      avgAccuracyPct: Math.round(t.avgAccuracyPct * 10) / 10,
      attempts: t.attempts,
    })),
  });
});

statsRouter.get("/keys", async (req, res) => {
  const userId = req.user!.id;

  const rows = await db.select().from(keyStats).where(eq(keyStats.userId, userId));

  const withRate = rows
    .map((r) => ({
      key: r.key,
      attemptsCount: r.attemptsCount,
      correctCount: r.correctCount,
      incorrectCount: r.incorrectCount,
      errorRate: r.attemptsCount > 0 ? r.incorrectCount / r.attemptsCount : 0,
      avgLatencyMs: r.avgLatencyMs,
      lastPracticedAt: r.lastPracticedAt,
    }))
    .sort((a, b) => b.errorRate - a.errorRate);

  res.json({ keys: withRate });
});
