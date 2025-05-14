import express from "express";
import { clerkClient } from "@clerk/express";
import { error } from "console";
const router = express.Router();

const {
  initializeApp,

  cert,
} = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const chatCollection = db.collection("chats");

const sendMessages = async (req: any, res: any) => {
  const userId = req.auth.userId;
  const { username } = await clerkClient.users.getUser(userId);

  const { text, receiverId } = req.body;
  if (!receiverId || !text)
    return res.status(400).json({ error: "Missing Fields" });
  const chatId = [userId, receiverId].sort().join("_");
  try {
    const chatRef = chatCollection.doc(chatId);
    const messageRef = chatRef.collection("messages");

    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      await chatRef.set({
        participants: [userId, receiverId],
        createdAt: Timestamp.now(),
      });
    }
    await messageRef.add({
      senderId: userId,
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
  const userId = req.auth.userId;
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

router.post("/send-texts", sendMessages);
router.get("/get-texts", getMessages);
export default router;
