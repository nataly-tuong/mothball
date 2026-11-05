import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(Number(process.env.PORT) || 3001, () => console.log("api on 3001"));
