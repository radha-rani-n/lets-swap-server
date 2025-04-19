import express from "express";
import { PrismaClient } from "../generated/prisma";
import { v4 as uuidv4 } from "uuid";
import { clerkClient, getAuth, requireAuth } from "@clerk/express";
import { error } from "console";
const prisma = new PrismaClient();
const router = express.Router();

type postProps = {
  userName: string;
  postId: string;
  plantImageUrl: string;
  locationLatitude: number;
  locationLongitude: number;
};

const getPosts = async (req: any, res: any) => {
  try {
    const allPosts = await prisma.post.findMany();
    res.status(200).json(allPosts);
  } catch (e) {
    console.error(e);
  }
};
const addPost = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const user = await clerkClient.users.getUser(userId);
  console.log(user);
  console.log("BODY RECEIVED:", req.body);
  const {
    postId,

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
      },
    });
    res.status(200).json(addNewPost);
  } catch (e: any) {
    res.status(400).json({ error: `Error adding new post ${e.message}` });
  } finally {
    await prisma.$disconnect();
  }
};

const deletePost = async (req, res) => {
  const { userId } = getAuth(req);
  const user = await clerkClient.users.getUser(userId);
  try {
    const { postId } = req.params;
    const post = await prisma.post.findUnique({
      where: { postId: postId, userName: user.username ?? "" },
    });
    if (!post) {
      return res.status(404).json({ error: `Post ID ${postId} not found` });
    }
    await prisma.post.delete({
      where: { userName: user.username ?? "", postId: postId },
    });
  } catch (e: any) {
    res.status(500).json({
      error: `Error deleting post ${req.params.postProps}: ${e.meaasage}`,
    });
  }
};
router.get("/", getPosts);
router.post("/", addPost);
router.delete("/", deletePost);
export default router;
