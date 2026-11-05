import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import prisma from "../prismaClient.js";
import { sendMail } from "../lib/mailer.js";
import { welcomeEmailHtml } from "../emails/welcome.js";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).send({ message: "Name, email, and password are required" });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    const hashedPassword = bcrypt.hashSync(String(password), 8);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
      },
    });

    try {
      await sendMail(user.email, "Welcome to Mothball!", welcomeEmailHtml);
    } catch {
      console.error("Welcome email failed to send");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });
    res.json({ token });
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
  const { email, password } = req.body;

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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });
    res.json({ token });
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    res.sendStatus(503);
  }
});

export default router;
