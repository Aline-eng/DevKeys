import { Router } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { typingAttempts, keyStats, bigramStats } from "../db/schema.js";
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

const MIN_BIGRAM_ATTEMPTS = 5;

statsRouter.get("/bigrams", async (req, res) => {
  const userId = req.user!.id;

  const rows = await db.select().from(bigramStats).where(eq(bigramStats.userId, userId));

  const withRate = rows
    .filter((r) => r.attemptsCount >= MIN_BIGRAM_ATTEMPTS)
    .map((r) => ({
      bigram: r.bigram,
      attemptsCount: r.attemptsCount,
      correctCount: r.correctCount,
      incorrectCount: r.incorrectCount,
      errorRate: r.attemptsCount > 0 ? r.incorrectCount / r.attemptsCount : 0,
      avgLatencyMs: r.avgLatencyMs,
      lastPracticedAt: r.lastPracticedAt,
    }))
    .sort((a, b) => b.errorRate - a.errorRate);

  res.json({ bigrams: withRate });
});

const MIN_KEY_ATTEMPTS_FOR_REPORT = 5;

async function periodSummary(userId: string, where: ReturnType<typeof and>) {
  const [row] = await db
    .select({
      sessions: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(avg(${typingAttempts.wpm}), 0)::float8`,
      avgAccuracyPct: sql<number>`coalesce(avg(${typingAttempts.accuracyPct}), 0)::float8`,
    })
    .from(typingAttempts)
    .where(and(eq(typingAttempts.userId, userId), where));

  return {
    sessions: row?.sessions ?? 0,
    avgWpm: row?.avgWpm ?? 0,
    avgAccuracyPct: row?.avgAccuracyPct ?? 0,
  };
}

statsRouter.get("/weekly-report", async (req, res) => {
  const userId = req.user!.id;

  const [thisWeek, lastWeek, keyRows] = await Promise.all([
    periodSummary(userId, gte(typingAttempts.completedAt, sql`now() - interval '7 days'`)),
    periodSummary(
      userId,
      and(
        gte(typingAttempts.completedAt, sql`now() - interval '14 days'`),
        sql`${typingAttempts.completedAt} < now() - interval '7 days'`,
      ),
    ),
    db.select().from(keyStats).where(eq(keyStats.userId, userId)),
  ]);

  const topWeakKeys = keyRows
    .filter((r) => r.attemptsCount >= MIN_KEY_ATTEMPTS_FOR_REPORT && r.incorrectCount > 0)
    .map((r) => ({ key: r.key, errorRate: r.incorrectCount / r.attemptsCount }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 3);

  const hasComparison = lastWeek.sessions > 0;

  res.json({
    thisWeek: {
      sessions: thisWeek.sessions,
      avgWpm: Math.round(thisWeek.avgWpm * 10) / 10,
      avgAccuracyPct: Math.round(thisWeek.avgAccuracyPct * 10) / 10,
    },
    wpmDelta: hasComparison ? Math.round((thisWeek.avgWpm - lastWeek.avgWpm) * 10) / 10 : null,
    accuracyDelta: hasComparison
      ? Math.round((thisWeek.avgAccuracyPct - lastWeek.avgAccuracyPct) * 10) / 10
      : null,
    topWeakKeys: topWeakKeys.map((k) => ({
      key: k.key,
      errorRatePct: Math.round(k.errorRate * 1000) / 10,
    })),
  });
});
