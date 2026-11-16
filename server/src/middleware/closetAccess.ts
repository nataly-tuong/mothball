import type { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient.js";

declare global {
  namespace Express {
    interface Request {
      closetId?: number;
      closetRole?: "OWNER" | "MEMBER";
    }
  }
}

export function parseId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function requireMember(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const closetId = parseId(req.params.closetId);

  if (!closetId || !req.userId) {
    return res.status(404).json({ message: "Closet not found." });
  }

  try {
    const membership = await prisma.closetMember.findUnique({
      where: { closetId_userId: { closetId, userId: req.userId } },
      select: { role: true },
    });

    if (!membership) {
      return res.status(404).json({ message: "Closet not found." });
    }

    req.closetId = closetId;
    req.closetRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.closetRole !== "OWNER") {
    return res
      .status(403)
      .json({ message: "Only the closet owner can do that." });
  }
  next();
}
