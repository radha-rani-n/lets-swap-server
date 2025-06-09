import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import texts from "./firebasetest";

import posts from "./routes/posts";
import http from "http";
import { Server, Socket } from "socket.io";

const app = express();
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket: Socket) => {
  console.log("User connected", socket.id);
  socket.on("send-message", (data) => {
    console.log("Message received", data);
    io.emit("receive message", data);
  });
});
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
server.listen(PORT, async () => {
  console.log("Server is listening to port" + PORT);
});
