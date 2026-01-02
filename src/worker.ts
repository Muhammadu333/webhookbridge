import { pool } from "./db.js";

const MAX_ATTEMPTS = 5;

async function processOneEvent(eventId: string) {
  // Simulated processing: in a real integration you would call internal services,
  // enqueue downstream work, or update business state in an idempotent way.
  await pool.query(
    "update events set status = 'processed', processed_at = now() where id = $1",
    [eventId]
  );
}

export async function runWorkerOnce() {
  const result = await pool.query(
    `select id, attempts, signature_valid
     from events
     where status = 'pending'
     order by received_at asc
     limit 5`
  );

  for (const row of result.rows) {
    const eventId = row.id as string;
    const signatureValid = row.signature_valid as boolean;
    const attempts = row.attempts as number;

    if (!signatureValid) {
      await pool.query(
        "update events set status = 'dead', last_error = $2 where id = $1",
        [eventId, "invalid_signature"]
      );
      continue;
    }

    try {
      await pool.query("update events set status = 'processing' where id = $1", [eventId]);
      await processOneEvent(eventId);
    } catch (err) {
      const nextAttempts = attempts + 1;
      const dead = nextAttempts >= MAX_ATTEMPTS;
      await pool.query(
        `update events
         set status = $2, attempts = $3, last_error = $4
         where id = $1`,
        [eventId, dead ? "dead" : "pending", nextAttempts, "processing_error"]
      );
    }
  }
}

