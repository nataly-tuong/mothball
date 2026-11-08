import rateLimit from "express-rate-limit";
import type { Request } from "express";

const MIN = 60 * 1000;

function limiter(
  windowMs: number,
  limit: number,
  message: string,
  keyGenerator?: (req: Request) => string,
) {
  return rateLimit({
    windowMs,
    limit,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
  });
}

export const loginLimiter = limiter(
  15 * MIN,
  10,
  "Too many login attempts. Please try again later.",
);

export const registerLimiter = limiter(
  15 * MIN,
  5,
  "Too many registration attempts. Please try again later.",
);

export const verifyEmailLimiter = limiter(
  15 * MIN,
  10,
  "Too many verification attempts. Please try again later.",
);

export const verifyCodeLimiter = limiter(
  15 * MIN,
  5,
  "Too many attempts. Please request a new code.",
  (req) =>
    String(req.body?.email ?? "")
      .trim()
      .toLowerCase() || "unknown",
);

export const resendLimiter = limiter(
  60 * MIN,
  3,
  "Too many requests. Please try again later.",
);

export const forgotPasswordLimiter = limiter(
  15 * MIN,
  5,
  "Too many requests. Please try again later.",
);

export const resetPasswordLimiter = limiter(
  15 * MIN,
  10,
  "Too many attempts. Please try again later.",
);

export const validateResetTokenLimiter = limiter(
  15 * MIN,
  30,
  "Too many attempts. Please try again later.",
);

export const perEmailEmailLimiter = limiter(
  15 * MIN,
  3,
  "Too many requests. Please try again later.",
  (req) =>
    String(req.body?.email ?? "")
      .trim()
      .toLowerCase() || "unknown",
);

export const accountLimiter = limiter(
  15 * MIN,
  5,
  "Too many attempts. Please try again later.",
  (req) => String(req.userId ?? "unknown"),
);
