import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../prismaClient.js";
import { sendMail } from "../../lib/mailer.js";
import { forgotPasswordHtml } from "../../emails/forgotPassword.js";
import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
  validateResetTokenLimiter,
} from "../../middleware/rateLimiters.js";
import { getPasswordError } from "../../lib/passwordRules.js";
import { createResetToken, hashToken } from "../../lib/tokens.js";

import { hashPassword } from "../../lib/passwordHash.js";

import {
  isPasswordBreached,
  BREACHED_PASSWORD_MESSAGE,
} from "../../lib/pwnedPassword.js";

const router = Router();

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).send({ message: "Email is required." });
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (user && user.emailVerified) {
        const { raw, hashed, expiry } = createResetToken();

        await prisma.user.update({
          where: { id: user.id },
          data: { resetToken: hashed, resetTokenExpiry: expiry },
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${raw}`;

        try {
          await sendMail(
            user.email,
            "Reset your Mothball password",
            forgotPasswordHtml(resetUrl),
          );
        } catch (emailError) {
          console.error("Password reset email failed:", emailError);
        }
      }

      return res.status(200).send({
        message:
          "If an account exists with that email, a password reset link will be sent.",
      });
    } catch (error) {
      console.error("Password reset request failed:", error);
      return res
        .status(500)
        .send({ message: "Unable to process your request." });
    }
  },
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (typeof token !== "string" || !token || typeof password !== "string") {
      return res
        .status(400)
        .send({ message: "Token and new password are required." });
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).send({ message: passwordError });
    }

    if (await isPasswordBreached(password)) {
      return res.status(400).send({ message: BREACHED_PASSWORD_MESSAGE });
    }

    try {
      const passwordHash = await hashPassword(password);

      const result = await prisma.user.updateMany({
        where: {
          resetToken: hashToken(token),
          resetTokenExpiry: { gt: new Date() },
        },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          tokenVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        return res.status(400).send({
          message: "This password reset link is invalid or has expired.",
        });
      }

      return res
        .status(200)
        .send({ message: "Your password has been successfully reset." });
    } catch (error) {
      console.error("Password reset failed:", error);
      return res
        .status(500)
        .send({ message: "Unable to reset your password." });
    }
  },
);

router.post(
  "/validate-reset-token",
  validateResetTokenLimiter,
  async (req: Request, res: Response) => {
    const { token } = req.body;

    if (typeof token !== "string" || !token) {
      return res
        .status(400)
        .send({ valid: false, message: "Reset token is required." });
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: hashToken(token),
          resetTokenExpiry: { gt: new Date() },
        },
        select: { id: true },
      });

      if (!user) {
        return res.status(400).send({
          valid: false,
          message: "This password reset link is invalid or has expired.",
        });
      }

      return res.status(200).send({ valid: true });
    } catch (error) {
      console.error("Reset token validation failed:", error);
      return res
        .status(500)
        .send({ valid: false, message: "Unable to validate reset link." });
    }
  },
);

export default router;
