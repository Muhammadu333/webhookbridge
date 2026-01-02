import crypto from "node:crypto";

export function hmacSha256Hex(secret: string, rawBody: Buffer): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

