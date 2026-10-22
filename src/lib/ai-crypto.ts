/**
 * Enkripsi API key provider AI (PRD 9.4): AES-256-GCM at-rest dengan
 * master key dari env `APP_ENCRYPTION_KEY` (set via `bunx convex env set`).
 *
 * File ini BUKAN module Convex — helper murni yang hanya di-import dari
 * file "use node" (actions), karena membaca process.env dan node:crypto.
 * Jangan di-import dari query/mutation runtime default.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const FORMAT_VERSION = "v1";

function masterKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY belum di-set di deployment Convex. " +
        "Jalankan: bunx convex env set APP_ENCRYPTION_KEY '<random 32+ karakter>'",
    );
  }
  // Turunkan master key apa adanya menjadi 32 byte (AES-256).
  return createHash("sha256").update(raw).digest();
}

/** AES-256-GCM. Output: v1:<iv b64>:<tag b64>:<ciphertext b64> */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    FORMAT_VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(":");
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error("Format API key terenkripsi tidak dikenal.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    masterKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** 4 karakter terakhir — satu-satunya bagian key yang boleh tampil di UI. */
export function maskLast4(key: string): string {
  return key.length <= 4 ? key : key.slice(-4);
}
