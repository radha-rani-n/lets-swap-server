import { clerkClient } from "@clerk/express";
import prisma from "../prisma";

const GUEST_USERNAME = "guest_user";

const getUsername = async (req: any): Promise<string | null> => {
  const userId = req.auth?.userId;
  if (!userId) return GUEST_USERNAME;
  const user = await clerkClient.users.getUser(userId);
  return user.username || null;
};

const MAX_IMAGES_PER_POST = 5;

const addPost = async (req: any, res: any) => {
  const username = await getUsername(req);
  if (!username) return res.status(400).json({ error: "Username not found" });
  const {
    postId,
    plantName,
    plantHeight,
    caption,
    plantImageUrl,
    plantImageUrls,
    locationLatitude,
    locationLongitude,
  } = req.body;

  const images: string[] = Array.isArray(plantImageUrls) && plantImageUrls.length > 0
    ? plantImageUrls.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
    : plantImageUrl
      ? [plantImageUrl]
      : [];

  if (images.length === 0 || !locationLatitude || !locationLongitude || !postId) {
    return res.status(400).json({ error: "some data is missing" });
  }
  if (images.length > MAX_IMAGES_PER_POST) {
    return res
      .status(400)
      .json({ error: `A post can have at most ${MAX_IMAGES_PER_POST} images` });
  }

  try {
    await prisma.post.create({
      data: {
        userName: username,
        postId,
        plantName: plantName?.trim() || null,
        plantHeight: plantHeight?.trim() || null,
        caption,
        plantImageUrl: images[0],
        plantImageUrls: images,
        locationLatitude,
        locationLongitude,
        status: "available",
      },
    });
    res.status(200).json({ messages: "Post added successfully", postId });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to add post");
  }
};

const getAllPosts = async (req: any, res: any) => {
  try {
    const allPosts = await prisma.post.findMany({
      orderBy: { timestamp: "asc" },
    });
    res.status(200).json(allPosts);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to get posts");
  }
};

const getUserPosts = async (req: any, res: any) => {
  try {
    const username = await getUsername(req);
    if (!username) {
      return res.status(400).json({ error: "Username not found for the user" });
    }
    const userPosts = await prisma.post.findMany({
      where: { userName: username },
      orderBy: { timestamp: "asc" },
    });
    res.status(200).json(userPosts);
  } catch (e) {
    console.error("getUserPosts failed:", e);
    res.status(500).send("Failed to get user posts");
  }
};

const deleteUserPost = async (req: any, res: any) => {
  const username = await getUsername(req);
  if (!username) {
    return res.status(400).json({ error: "Username not found for the user" });
  }
  try {
    const { postId } = req.params;
    const post = await prisma.post.findFirst({
      where: { postId, userName: username },
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    await prisma.post.delete({ where: { postId } });
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (e: any) {
    res.status(500).json({
      error: `Error deleting post ${req.params.postId}: ${e.message}`,
    });
  }
};

const updatePostStatus = async (req: any, res: any) => {
  const username = await getUsername(req);
  if (!username) {
    return res.status(400).json({ error: "Username not found for the user" });
  }
  const { postId } = req.params;
  const { status } = req.body;
  const validStatuses = ["available", "reserved", "swapped"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }
  try {
    const post = await prisma.post.findFirst({
      where: { postId, userName: username },
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    await prisma.post.update({
      where: { postId },
      data: { status },
    });
    return res
      .status(200)
      .json({ message: "Post status updated successfully", status });
  } catch (e: any) {
    res.status(500).json({
      error: `Error updating post status: ${e.message}`,
    });
  }
};

export { addPost, getAllPosts, getUserPosts, deleteUserPost, updatePostStatus };
