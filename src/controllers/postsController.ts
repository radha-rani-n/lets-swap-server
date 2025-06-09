import express from "express";
import { PrismaClient } from "../../generated/prisma";
import { v4 as uuidv4 } from "uuid";
import { clerkClient, getAuth, requireAuth } from "@clerk/express";
const prisma = new PrismaClient();
const router = express.Router();
import { User } from "@clerk/express";
import { db } from "../firebase";
type postProps = {
  userName: string;
  postId: string;
  caption: string;
  plantImageUrl: string;
  locationLatitude: number;
  locationLongitude: number;
};

const postCollection = db.collection("posts");

const getAllPosts = async (req: any, res: any) => {
  try {
    const allPosts = await prisma.post.findMany();
    res.status(200).json(allPosts);
  } catch (e) {
    console.error(e);
  }
};
const getUserPosts = async (req: any, res: any) => {
  const userId = req.auth.userId;

  const user: User = await clerkClient.users.getUser(userId);
  const username = user.username;
  if (!username) {
    return res.status(400).json({ error: "Username not found for the user" });
  }
  try {
    const userPosts = await prisma.post.findMany({
      where: { userName: user.username },
    });
    res.status(200).json(userPosts);
  } catch (e) {
    console.error(e);
  }
};
const addPost = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const user = await clerkClient.users.getUser(userId);

  const {
    postId,
    caption,
    plantImageUrl,
    locationLatitude,
    locationLongitude,
  }: postProps = req.body;
  if (!plantImageUrl || !locationLatitude || !locationLongitude || !postId) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const addNewPost = await prisma.post.create({
      data: {
        userName: user.username ?? "",
        plantImageUrl,
        locationLatitude,
        locationLongitude,
        postId,
        caption,
      },
    });
    res.status(200).json(addNewPost);
  } catch (e: any) {
    res.status(400).json({ error: `Error adding new post ${e.message}` });
  } finally {
    await prisma.$disconnect();
  }
};

const deletePost = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const user = await clerkClient.users.getUser(userId);
  try {
    const { postId } = req.params;
    const post = await prisma.post.findUnique({
      where: { postId: postId, userName: user.username ?? undefined },
    });
    if (!post) {
      return res.status(404).json({ error: `Post ID ${postId} not found` });
    }
    await prisma.post.delete({
      where: { userName: user.username ?? "", postId: postId },
    });
    res.status(200).json({ Message: "Post deleted successfully" });
  } catch (e: any) {
    res.status(500).json({
      error: `Error deleting post ${req.params.postProps}: ${e.message}`,
    });
  }
};
router.get("/", getAllPosts);
router.get("/userPosts", getUserPosts);
router.post("/", addPost);
router.delete("/:postId", deletePost);

export default router;
