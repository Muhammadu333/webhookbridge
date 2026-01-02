import { Router } from "express";
import { pool } from "../db.js";
import { env } from "../env.js";
import { hmacSha256Hex, timingSafeEqualHex } from "../security/signature.js";

export const webhooksRouter = Router();

// Raw body is needed for signature verification.
webhooksRouter.post(
  "/provider-x",
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (req, res) => {
    // This handler expects `req.body` to be a Buffer (set by express.raw).
    const rawBody = req.body as Buffer;
    const signature = String(req.header("x-provider-signature") ?? "");
    const idempotencyKey = String(req.header("idempotency-key") ?? "");

    if (!idempotencyKey || idempotencyKey.length > 200) {
      return res.status(400).json({ error: "invalid_idempotency_key" });
    }

    const expected = hmacSha256Hex(env.webhookSecret, rawBody);
    const signatureValid = signature && timingSafeEqualHex(signature, expected);

    // Parse JSON safely after signature verification (still validate size limits at middleware).
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "invalid_json" });
    }

    try {
      await pool.query(
        `insert into events (provider, idempotency_key, signature_valid, payload)
         values ($1, $2, $3, $4)
         on conflict (provider, idempotency_key) do nothing`,
        ["provider-x", idempotencyKey, Boolean(signatureValid), payload]
      );
    } catch {
      return res.status(500).json({ error: "db_error" });
    }

    // Return 2xx quickly; processing happens in the background worker.
    return res.status(202).json({ accepted: true, signatureValid: Boolean(signatureValid) });
  }
);

