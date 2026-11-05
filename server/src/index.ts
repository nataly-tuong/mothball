import express from "express";
import { prisma } from "./prisma.js";
import testRouter from "./routes/test.js";

const app = express();
app.use(express.json());

app.use("/api/test", testRouter);

app.get("/api/items", async (req, res) => {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

app.listen(Number(process.env.PORT) || 3001, () => console.log("api on 3001"));
