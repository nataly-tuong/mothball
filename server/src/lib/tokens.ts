import crypto from "crypto";

const CODE_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export function hashVerificationCode(email: string, code: string) {
  return crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export function createVerificationCode(email: string) {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return {
    code,
    hashed: hashVerificationCode(email, code),
    expiry: new Date(Date.now() + CODE_TTL_MS),
  };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createResetToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  return {
    raw,
    hashed: hashToken(raw),
    expiry: new Date(Date.now() + RESET_TTL_MS),
  };
}
