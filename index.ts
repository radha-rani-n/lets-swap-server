import express from "express";
import "dotenv/config";
import cors from "cors";

import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("This is home page");
});
app.listen(PORT, async () => {
  console.log("Server is listening to port" + PORT);
  try {
    const allUsers = await prisma.post.findMany();
    console.log(allUsers);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
});
