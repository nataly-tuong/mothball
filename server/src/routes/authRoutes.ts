import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import prisma from "../prismaClient.js";
import { sendMail } from "../lib/mailer.js";
import { welcomeEmailHtml } from "../emails/welcome.js";
import authMiddleware from "../middleware/authMiddleware.js";
import crypto from "crypto";

const router = express.Router();

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.sendStatus(404);
    }

    res.status(200).send({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.sendStatus(500);
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).send({ message: "Name, email, and password are required" });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    const hashedPassword = bcrypt.hashSync(String(password), 8);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        verificationToken: hashedToken,
        verificationTokenExpiry: tokenExpiry,
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

    try {
      await sendMail(
        user.email,
        "Verify your Mothball email",
        welcomeEmailHtml(verificationUrl),
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
});

router.post("/login", async (req: Request, res: Response) => {
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

    const passwordIsValid = bcrypt.compareSync(
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

    const shouldRemember = remember === true;

    const expiresIn = shouldRemember ? "30d" : "24h";

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",

      ...(shouldRemember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    });

    res.sendStatus(204);
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    res.sendStatus(503);
  }
});

router.post("/verify-email", async (req: Request, res: Response) => {
  const { token } = req.body;

  if (typeof token !== "string" || !token) {
    res.status(400).send({ message: "Verification token is required" });
    return;
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).send({
        message: "Invalid or expired verification link",
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    res.status(200).send({
      message: "Email verified successfully!",
    });
  } catch (err) {
    console.error("Email verification failed:", err);
    res.sendStatus(500);
  }
});

router.post("/resend-verification", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).send({ message: "Email is required" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.emailVerified) {
      res.status(200).send({
        message: "If your account needs verification, an email will be sent.",
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpiry: tokenExpiry,
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

    await sendMail(
      user.email,
      "Verify your Mothball email",
      welcomeEmailHtml(verificationUrl),
    );

    res.status(200).send({
      message: "If your account needs verification, an email will be sent.",
    });
  } catch (error) {
    console.error("Resending verification email failed:", error);
    res.status(500).send({ message: "Unable to process your request." });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.sendStatus(204);
});

export default router;
