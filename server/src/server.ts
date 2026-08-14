import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { pool } from "./db/db.js";
import { auth } from "./lib/auth.js";
import { textsRouter } from "./routes/texts.js";
import { attemptsRouter } from "./routes/attempts.js";
import { statsRouter } from "./routes/stats.js";
import { requireAuth } from "./middleware/require-auth.js";
import { authLimiter } from "./middleware/rate-limit.js";

const app = express();

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: [CLIENT_URL],
    credentials: true,
  }),
);

// better-auth needs the raw request body, so it must be mounted before
// express.json() runs on its routes.
app.use("/api/auth", authLimiter, toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    message: "AI Typing Coach Backend Running",
  });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api/texts", textsRouter);
app.use("/api/attempts", attemptsRouter);
app.use("/api/stats", statsRouter);

const PORT = process.env.PORT ?? 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
