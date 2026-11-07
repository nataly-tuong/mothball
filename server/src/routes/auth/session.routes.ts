import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../prismaClient.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { loginLimiter } from "../../middleware/rateLimiters.js";
import { issueAuthCookie } from "../../lib/authCookie.js";

const router = Router();

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return res.sendStatus(404);
    }

    res.status(200).send(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.sendStatus(500);
  }
});

router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    res.status(400).send({ message: "Email and password are required" });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(401).send({ message: "Invalid credentials" });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      String(password),
      user.passwordHash,
    );
    if (!passwordIsValid) {
      res.status(401).send({ message: "Invalid credentials" });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).send({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    issueAuthCookie(res, user, remember === true);
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    res.sendStatus(503);
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.sendStatus(204);
});

export default router;
