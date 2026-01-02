import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pino from "pino-http";
import { env } from "./env.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { eventsRouter } from "./routes/events.js";
import { runWorkerOnce } from "./worker.js";

if (!env.databaseUrl) throw new Error("DATABASE_URL is required");
if (!env.webhookSecret || env.webhookSecret.length < 24)
  throw new Error("WEBHOOK_SECRET must be set to a long random value");

const app = express();
app.disable("x-powered-by");
app.use(pino());
app.use(helmet());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(
  "/webhooks",
  rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false })
);

// For signature verification, we need the raw body for webhook endpoints.
app.use("/webhooks", express.raw({ type: "application/json", limit: "200kb" }));
app.use("/webhooks", webhooksRouter);

// Monitoring endpoints: JSON parsing is fine here.
app.use("/events", express.json({ limit: "100kb" }));
app.use("/events", eventsRouter);

setInterval(() => {
  runWorkerOnce().catch(() => {});
}, 1000);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`webhookbridge listening on :${env.port}`);
});

