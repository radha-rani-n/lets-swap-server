import express from "express";
import { clerkClient } from "@clerk/express";
import { User } from "@clerk/express";
const router = express.Router();
import { getAuth } from "@clerk/express";
import { getDocs, collection, query } from "firebase/firestore";
type Chat = {
  text: string;
  senderName: string;
};

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const chatCollection = db.collection("chats");

const getUserId = async (req: any, res: any) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  return userId;
};

const sendMessages = async (req: any, res: any) => {
  const userId = await getUserId(req, res);
  const { username } = await clerkClient.users.getUser(userId);

  const { text, receipientID } = req.body;

  if (!receipientID || !text) {
    return res.status(400).json({ error: "Missing Fields" });
  }
  console.log(username);

  try {
    const chatId = [username, receipientID].join("_");
    const chatDocument = await chatCollection.doc(chatId);
    chatDocument.set({
      user: username,
    });
    const messagesCollection = chatDocument.collection("messages");

    await messagesCollection.add({
      senderId: userId,
      senderName: username,
      text,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ message: "Message Sent", chatId });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send message");
  }
};
const getMessages = async (req: any, res: any) => {
  const { receiverId } = req.query;

  const userId = await getUserId(req, res);

  if (!receiverId) return res.status(400).json({ error: "Missing receiverId" });
  const chatId = [userId, receiverId].sort().join("_");
  try {
    const snapshot = await chatCollection
      .doc(chatId)
      .collection("messages")
      .orderBy("timestamp")
      .get();
    const messages = snapshot.docs.map((doc: any) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    res.status(200).json({ chatId, messages });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to fetch messages");
  }
};

const getAllChats = async (req: any, res: any) => {
  try {
    const snapshot = await db.collection("chats").get();

    const messages = snapshot.docs.map((doc: any) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    const chatId = messages[0].id;
    const snapshot2 = await db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .get();

    const messages2 = snapshot2.docs.map((doc: any) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    console.log(messages2[0]);
    res.status(200).json({ messages2 });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to fetch chats", e);
  }
};

router.get("/get-user-chats", getAllChats);
router.post("/send-texts", sendMessages);
router.get("/get-texts", getMessages);

export default router;
