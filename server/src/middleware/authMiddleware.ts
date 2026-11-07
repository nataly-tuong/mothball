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

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true },
    });

    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
      });
    }

    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
