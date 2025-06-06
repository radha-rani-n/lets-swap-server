import { clerkClient } from "@clerk/express";
import { db } from "../firebase";
import { ClerkClient } from "@clerk/express";
const postCollection = db.collection("posts");
import { Timestamp } from "firebase-admin/firestore";
const addPost = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const user = await clerkClient.users.getUser(userId);
  const {
    postId,
    caption,
    plantImageUrl,
    locationLatitude,
    locationLongitude,
  } = req.body;
  if (!plantImageUrl || !locationLatitude || !locationLongitude || !postId) {
    return res.status(400).json({ error: "some data ismissing" });
  }
  try {
    await postCollection.add({
      userName: user.username,
      postId: postId,
      caption: caption,
      plantImageUrl: plantImageUrl,
      locationLatitude: locationLatitude,
      locationLongitude: locationLongitude,
      timestamp: Timestamp.now(),
    });
    res.status(200).json({ messages: "Post added successfully", postId });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to add post");
  }
};
const getAllPosts = async (req: any, res: any) => {
  try {
    const snapshot = await postCollection.orderBy("timestamp").get();
    const allPosts = snapshot.docs.map((doc: any) => {
      return {
        ...doc.data(),
      };
    });

    res.status(200).json(allPosts);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to get posts");
  }
};

export { addPost, getAllPosts };
