import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
const allowedOrigins = new Set([frontendUrl]);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use((req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({
      message: "Forbidden: Invalid request origin.",
    });
  }

  next();
});

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid request body." });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong." });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`api on ${port}`));
