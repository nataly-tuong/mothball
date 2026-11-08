import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../../prismaClient.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { accountLimiter } from "../../middleware/rateLimiters.js";
import { sendMail } from "../../lib/mailer.js";
import {
  createVerificationCode,
  hashVerificationCode,
} from "../../lib/tokens.js";
import { deleteCodeHtml } from "../../emails/deleteCode.js";
import { accountDeletedHtml } from "../../emails/accountDeleted.js";

const router = Router();

router.post(
  "/account/delete-code",
  authMiddleware,
  accountLimiter,
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true },
      });

      if (!user) return res.sendStatus(404);

      const { code, hashed, expiry } = createVerificationCode(user.email);

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: hashed, verificationTokenExpiry: expiry },
      });

      void sendMail(
        user.email,
        "Confirm deleting your Mothball account",
        deleteCodeHtml(code),
      ).catch((err) => console.error("Delete code email failed:", err));

      res.sendStatus(204);
    } catch (err) {
      console.error("Delete code request failed:", err);
      res.sendStatus(500);
    }
  },
);

router.delete(
  "/account",
  authMiddleware,
  accountLimiter,
  async (req: Request, res: Response) => {
    const { code } = req.body;

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return res.status(400).send({ message: "Enter the 6-digit code." });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      const invalid = () =>
        res.status(400).send({ message: "Invalid or expired code." });

      if (
        !user ||
        !user.verificationToken ||
        !user.verificationTokenExpiry ||
        user.verificationTokenExpiry < new Date()
      ) {
        return invalid();
      }

      const submitted = Buffer.from(hashVerificationCode(user.email, code));
      const stored = Buffer.from(user.verificationToken);

      if (
        submitted.length !== stored.length ||
        !crypto.timingSafeEqual(submitted, stored)
      ) {
        return invalid();
      }

      await prisma.user.delete({ where: { id: user.id } });

      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      void sendMail(
        user.email,
        "Your Mothball account was deleted",
        accountDeletedHtml(),
      ).catch((err) => console.error("Account deleted email failed:", err));

      res.sendStatus(204);
    } catch (err) {
      console.error("Account deletion failed:", err);
      res.status(500).send({ message: "Unable to delete your account." });
    }
  },
);

export default router;
