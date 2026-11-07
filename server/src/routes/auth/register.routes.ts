import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../prismaClient.js";
import { sendMail } from "../../lib/mailer.js";
import { welcomeEmailHtml } from "../../emails/welcome.js";
import { registerLimiter } from "../../middleware/rateLimiters.js";
import { getPasswordError } from "../../lib/passwordRules.js";
import { createVerificationCode } from "../../lib/tokens.js";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res
        .status(400)
        .send({ message: "Name, email, and password are required" });
      return;
    }

    if (typeof password !== "string") {
      return res.status(400).send({ message: "A valid password is required." });
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).send({ message: passwordError });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { code, hashed, expiry } = createVerificationCode(cleanEmail);

      const user = await prisma.user.create({
        data: {
          name: String(name).trim(),
          email: cleanEmail,
          passwordHash: hashedPassword,
          verificationToken: hashed,
          verificationTokenExpiry: expiry,
        },
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
        res.status(409).send({ message: "Email already in use" });
        return;
      }

      if (err instanceof Error) {
        console.log(err.message);
      }

      res.sendStatus(503);
    }
  },
);

export default router;
