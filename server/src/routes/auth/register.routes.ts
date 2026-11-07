import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../../prismaClient.js";
import { sendMail } from "../../lib/mailer.js";
import { welcomeEmailHtml } from "../../emails/welcome.js";
import { registerLimiter } from "../../middleware/rateLimiters.js";
import { getPasswordError } from "../../lib/passwordRules.js";
import { getNameError, getEmailError } from "../../lib/validation.js";
import { hashPassword } from "../../lib/passwordHash.js";
import { createVerificationCode } from "../../lib/tokens.js";

import {
  isPasswordBreached,
  BREACHED_PASSWORD_MESSAGE,
} from "../../lib/pwnedPassword.js";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .send({ message: "Name, email, and password are required" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const fieldError =
      getNameError(cleanName) ??
      getEmailError(cleanEmail) ??
      getPasswordError(password);

    if (fieldError) {
      return res.status(400).send({ message: fieldError });
    }

    if (await isPasswordBreached(password)) {
      return res.status(400).send({ message: BREACHED_PASSWORD_MESSAGE });
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, emailVerified: true },
      });

      if (existing?.emailVerified) {
        return res.status(409).send({ message: "Email already in use" });
      }

      const passwordHash = await hashPassword(password);
      const { code, hashed, expiry } = createVerificationCode(cleanEmail);

      const verificationData = {
        name: cleanName,
        passwordHash,
        verificationToken: hashed,
        verificationTokenExpiry: expiry,
      };

      const user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              ...verificationData,
              resetToken: null,
              resetTokenExpiry: null,
            },
          })
        : await prisma.user.create({
            data: { email: cleanEmail, ...verificationData },
          });

      try {
        await sendMail(
          user.email,
          "Your Mothball verification code",
          welcomeEmailHtml(code),
        );
      } catch (error) {
        console.error("Verification email failed to send:", error);
      }

      res.sendStatus(204);
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "P2002"
      ) {
        return res.status(409).send({ message: "Email already in use" });
      }

      if (err instanceof Error) {
        console.log(err.message);
      }

      res.sendStatus(503);
    }
  },
);

export default router;
