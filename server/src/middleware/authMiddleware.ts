import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";
import {
  isSessionKind,
  issueAuthCookie,
  shouldRenewSession,
  type SessionKind,
} from "../lib/authCookie.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

type Session = {
  userId: number;
  tokenVersion: number;
  kind: SessionKind;
  issuedAt: number;
};

export async function getSessionUserId(req: Request): Promise<number | null> {
  return (await getSession(req))?.userId ?? null;
}

export async function getSession(req: Request): Promise<Session | null> {
  const token = req.cookies?.token;

  if (typeof token !== "string" || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;

    const userId = decoded.userId;

    if (typeof userId !== "number") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      return null;
    }

    return {
      userId,
      tokenVersion: user.tokenVersion,
      kind: isSessionKind(decoded.kind) ? decoded.kind : "short",
      issuedAt: typeof decoded.iat === "number" ? decoded.iat : 0,
    };
  } catch {
    return null;
  }
}

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.cookies?.token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const session = await getSession(req);

  if (!session) {
    return res
      .status(401)
      .json({ message: "Session expired. Please log in again." });
  }

  if (shouldRenewSession(session.kind, session.issuedAt)) {
    issueAuthCookie(
      res,
      { id: session.userId, tokenVersion: session.tokenVersion },
      session.kind,
    );
  }

  req.userId = session.userId;
  next();
}
