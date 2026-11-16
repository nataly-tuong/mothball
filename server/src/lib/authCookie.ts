import jwt from "jsonwebtoken";
import type { Response } from "express";

export type SessionKind = "short" | "long" | "app";

const SESSION_DAYS: Record<SessionKind, number> = {
  short: 1,
  long: 30,
  app: 90,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionKindFrom(options: {
  remember?: unknown;
  app?: unknown;
}): SessionKind {
  if (options.app === true) return "app";
  if (options.remember === true) return "long";
  return "short";
}

export function isSessionKind(value: unknown): value is SessionKind {
  return value === "short" || value === "long" || value === "app";
}

export function issueAuthCookie(
  res: Response,
  user: { id: string | number; tokenVersion: number },
  kind: SessionKind = "short",
) {
  const days = SESSION_DAYS[kind];
  const token = jwt.sign(
    {
      id: user.id,
      userId: user.id,
      tokenVersion: user.tokenVersion,
      kind,
    },
    process.env.JWT_SECRET!,
    { expiresIn: `${days}d`, algorithm: "HS256" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: days * DAY_MS,
  });
}

export function shouldRenewSession(kind: SessionKind, issuedAtSec: number) {
  if (kind === "short") return false;
  return Date.now() - issuedAtSec * 1000 > DAY_MS;
}
