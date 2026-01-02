import { Router } from "express";
import { pool } from "../db.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (_req, res) => {
  const result = await pool.query(
    `select id, provider, idempotency_key, signature_valid, status, attempts, last_error, received_at, processed_at
     from events
     order by received_at desc
     limit 100`
  );
  return res.json({ events: result.rows });
});

