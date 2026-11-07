import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../../prismaClient.js";
import { sendMail } from "../../lib/mailer.js";
import { welcomeEmailHtml } from "../../emails/welcome.js";
import {
  verifyEmailLimiter,
  verifyCodeLimiter,
  resendLimiter,
  perEmailEmailLimiter,
} from "../../middleware/rateLimiters.js";
import {
  createVerificationCode,
  hashVerificationCode,
} from "../../lib/tokens.js";
import { issueAuthCookie } from "../../lib/authCookie.js";

const router = Router();

router.post(
  "/verify-email",
  verifyEmailLimiter,
  verifyCodeLimiter,
  async (req: Request, res: Response) => {
    const { email, code } = req.body;

    if (
      typeof email !== "string" ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code)
    ) {
      res.status(400).send({ message: "Enter the 6-digit code." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
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

      const submitted = Buffer.from(hashVerificationCode(cleanEmail, code));
      const stored = Buffer.from(user.verificationToken);

      if (
        submitted.length !== stored.length ||
        !crypto.timingSafeEqual(submitted, stored)
      ) {
        return invalid();
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      issueAuthCookie(res, user, true);

      res.status(200).send({ message: "Email verified successfully!" });
    } catch (err) {
      console.error("Email verification failed:", err);
      res.sendStatus(500);
    }
  },
);

router.post(
  "/resend-verification",
  resendLimiter,
  perEmailEmailLimiter,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).send({ message: "Email is required" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const genericReply = {
      message: "If your account needs verification, a new code will be sent.",
    };

    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user || user.emailVerified) {
        res.status(200).send(genericReply);
        return;
      }

      const { code, hashed, expiry } = createVerificationCode(cleanEmail);

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: hashed, verificationTokenExpiry: expiry },
      });

      await sendMail(
        user.email,
        "Your Mothball verification code",
        welcomeEmailHtml(code),
      );

      res.status(200).send(genericReply);
    } catch (error) {
      console.error("Resending verification email failed:", error);
      res.status(500).send({ message: "Unable to process your request." });
    }
  },
);

export default router;
