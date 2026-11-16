import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./routes/authRoutes.js";
import closetRoutes from "./routes/closetRoutes.js";
import { startCleanupJobs } from "./lib/cleanup.js";
import { frontendUrl, isProduction } from "./lib/config.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "JWT_SECRET is shorter than 32 characters. Generate a longer random secret.",
  );
}

const allowedOrigins = new Set([frontendUrl]);

if (isProduction) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 1);
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

app.get("/api/health", (req: Request, res: Response) => {
  const forwarded = String(req.headers["x-forwarded-for"] ?? "");
  res.set("Cache-Control", "no-store");
  res.send({
    ok: true,
    yourIp: req.ip,
    proxyHops: forwarded ? forwarded.split(",").length : 0,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/closets", closetRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid request body." });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong." });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`api on ${port}`);
  startCleanupJobs();
});
