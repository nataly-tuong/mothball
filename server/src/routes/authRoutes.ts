import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
    });

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
