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
    const allPosts = await prisma.post.create({
      data: {
        userName: "Radha",
        postId: "2",
        plantImageUrl:
          "https://www.vecteezy.com/photo/49506411-cute-puppy-lying-on-wooden-floor-in-brightly-lit-room-showcasing-playful-demeanor",
        locationLatitude: 43.88998,
        locationLongitude: 78.87935,
      },
    });
    console.dir(allPosts);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
});
