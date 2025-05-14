import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import texts from "./firebasetest";
import posts from "./controllers/postsController";
import messages from "./firebasesdk";
const app = express();
const PORT = process.env.PORT || 8080;
app.use(
  clerkMiddleware({
    authorizedParties: ["http://localhost:5173"],
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);
app.use(cors());
app.use(express.json());

app.use("/", posts);
app.use("/", texts);
// app.use("/", messages);
app.listen(PORT, async () => {
  console.log("Server is listening to port" + PORT);
});
