import { clerkClient } from "@clerk/express";
import { db } from "../firebase";
import { ClerkClient } from "@clerk/express";

import { User } from "@clerk/express";
import { Timestamp } from "firebase-admin/firestore";
import { snapshot } from "node:test";
const postCollection = db.collection("posts");
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
const getUserPosts = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const user: User = await clerkClient.users.getUser(userId);
  const username = user.username;
  if (!username) {
    return res.status(400).json({ error: "Username not found for the user" });
  }
  try {
    const userPostsSnapShot = await postCollection
      .orderBy("timestamp")
      .where("userName", "==", username)
      .get();
    const userPosts = userPostsSnapShot.docs.map((doc) => {
      return {
        ...doc.data(),
      };
    });
    res.status(200).json(userPosts);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to get user posts");
  }
};
const deleteUserPost = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const user = await clerkClient.users.getUser(userId);
  const username = user.username;
  if (!username) {
    return res.status(400).json({ error: "Username not found for the user" });
  }
  try {
    const { postId } = req.params;
    const postSnapshot = await postCollection
      .where("postId", "==", postId)
      .where("userName", "==", username)
      .get();
    const postDoc = postSnapshot.docs[0];
    await postDoc.ref.delete();
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (e: any) {
    res.status(500).json({
      error: `Error deleting post ${req.params.postProps}: ${e.message}`,
    });
  }
};

export { addPost, getAllPosts, getUserPosts, deleteUserPost };
