import { Router } from "express";
import { z } from "zod";
import { and, eq, asc } from "drizzle-orm";
import { db } from "../db/db.js";
import { practiceTexts } from "../db/schema.js";

export const textsRouter = Router();

const listQuerySchema = z.object({
  category: z.enum(["code", "prose", "quote"]).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.coerce.number().int().min(0).optional(),
});

textsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query params", issues: parsed.error.issues });
  }
  const { category, difficulty, limit, cursor } = parsed.data;

  const conditions = [
    category ? eq(practiceTexts.category, category) : undefined,
    difficulty ? eq(practiceTexts.difficulty, difficulty) : undefined,
  ].filter((c) => c !== undefined);

  const rows = await db.query.practiceTexts.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: asc(practiceTexts.createdAt),
    limit,
    offset: cursor ?? 0,
  });

  res.json({ texts: rows });
});

textsRouter.get("/:id", async (req, res) => {
  const row = await db.query.practiceTexts.findFirst({
    where: eq(practiceTexts.id, req.params.id),
  });

  if (!row) {
    return res.status(404).json({ message: "Practice text not found" });
  }

  res.json({ text: row });
});
