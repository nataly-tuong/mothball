import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(Number(process.env.PORT) || 3001, () => console.log("api on 3001"));
