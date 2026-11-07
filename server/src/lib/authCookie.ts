import jwt from "jsonwebtoken";
import type { Response } from "express";

export function issueAuthCookie(
  res: Response,
  user: { id: string | number; tokenVersion: number },
  remember = false,
) {
  const token = jwt.sign(
    { id: user.id, userId: user.id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET!,
    { expiresIn: remember ? "30d" : "24h" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    ...(remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
  });
}
