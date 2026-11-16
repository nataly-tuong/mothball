import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../../prismaClient.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { accountLimiter, loginLimiter } from "../../middleware/rateLimiters.js";
import { issueAuthCookie } from "../../lib/authCookie.js";
import { getNameError } from "../../lib/validation.js";

import {
  verifyPassword,
  hashPassword,
  needsRehash,
} from "../../lib/passwordHash.js";

const router = Router();

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        passwordHash: true,
        googleId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.sendStatus(404);
    }

    const { passwordHash, googleId, ...profile } = user;

    res.status(200).send({
      ...profile,
      hasPassword: passwordHash !== null,
      hasGoogle: googleId !== null,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.sendStatus(500);
  }
});

router.patch(
  "/me",
  authMiddleware,
  accountLimiter,
  async (req: Request, res: Response) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const nameError = getNameError(name);

    if (nameError) {
      return res.status(400).send({ message: nameError });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      select: { name: true },
    });

    res.send(user);
  },
);

router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password, remember } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    res.status(400).send({ message: "Email and password are required" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const passwordIsValid = await verifyPassword(password, user?.passwordHash);

    if (!user || !passwordIsValid) {
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

    if (user.passwordHash && needsRehash(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) },
      });
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
