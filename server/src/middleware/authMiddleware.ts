import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export async function getSessionUserId(req: Request): Promise<number | null> {
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

    return userId;
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

  const userId = await getSessionUserId(req);

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Session expired. Please log in again." });
  }

  req.userId = userId;
  next();
}
