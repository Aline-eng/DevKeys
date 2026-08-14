import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { keyStats, bigramStats, practiceTexts } from "../db/schema.js";
import { requireAuth } from "../middleware/require-auth.js";
import { drillGenerateLimiter } from "../middleware/rate-limit.js";
import { generateDrillText, normalizeKey, type WeightedTarget } from "../lib/drill-generator.js";

export const drillsRouter = Router();

drillsRouter.use(requireAuth);

const MIN_KEY_ATTEMPTS = 5;
const MIN_BIGRAM_ATTEMPTS = 5;
const TOP_KEYS = 8;
const TOP_BIGRAMS = 6;

function topWeighted(
  rows: { normalized: string; attemptsCount: number; incorrectCount: number }[],
  minAttempts: number,
  top: number,
  weightScale: number,
): WeightedTarget[] {
  const merged = new Map<string, { attempts: number; incorrect: number }>();
  for (const r of rows) {
    if (r.attemptsCount < minAttempts) continue;
    const entry = merged.get(r.normalized) ?? { attempts: 0, incorrect: 0 };
    entry.attempts += r.attemptsCount;
    entry.incorrect += r.incorrectCount;
    merged.set(r.normalized, entry);
  }

  return Array.from(merged.entries())
    .map(([key, v]) => ({ key, weight: (v.incorrect / v.attempts) * weightScale }))
    .filter((w) => w.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, top);
}

drillsRouter.post("/generate", drillGenerateLimiter, async (req, res) => {
  const userId = req.user!.id;

  const [keyRows, bigramRows] = await Promise.all([
    db.select().from(keyStats).where(eq(keyStats.userId, userId)),
    db.select().from(bigramStats).where(eq(bigramStats.userId, userId)),
  ]);

  if (keyRows.length === 0) {
    return res.status(400).json({ message: "Complete a few practice sessions first so there's data to target." });
  }

  const weakKeys = topWeighted(
    keyRows.map((r) => ({
      normalized: normalizeKey(r.key),
      attemptsCount: r.attemptsCount,
      incorrectCount: r.incorrectCount,
    })),
    MIN_KEY_ATTEMPTS,
    TOP_KEYS,
    20,
  );

  const weakBigrams = topWeighted(
    bigramRows.map((r) => ({
      normalized: normalizeKey(r.bigram[0]) + normalizeKey(r.bigram[1]),
      attemptsCount: r.attemptsCount,
      incorrectCount: r.incorrectCount,
    })),
    MIN_BIGRAM_ATTEMPTS,
    TOP_BIGRAMS,
    15,
  );

  const body = generateDrillText(weakKeys, weakBigrams, 40);

  const label = weakKeys.length > 0 ? weakKeys.slice(0, 3).map((k) => k.key).join(", ") : "general";

  const [text] = await db
    .insert(practiceTexts)
    .values({
      title: `Weak-key drill: ${label}`,
      body,
      category: "prose",
      difficulty: 3,
      charCount: body.length,
      source: "generated",
      ownerUserId: userId,
    })
    .returning();

  res.status(201).json({ text, targetedKeys: weakKeys.map((k) => k.key), targetedBigrams: weakBigrams.map((b) => b.key) });
});
