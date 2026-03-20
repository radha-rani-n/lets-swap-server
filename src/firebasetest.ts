import express from "express";
import { clerkClient } from "@clerk/express";
import { Timestamp } from "firebase-admin/firestore";
const router = express.Router();
import { getAuth } from "@clerk/express";
import { db } from "./firebase";
const chatCollection = db.collection("chats");

const getUserId = (req: any): string | null => {
  const { userId } = getAuth(req);
  return userId ?? null;
};

const sendMessages = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const { username } = await clerkClient.users.getUser(userId);

  const { text, receipientID, imageUrl } = req.body;

  if (!receipientID || !text) {
    return res.status(400).json({ error: "Missing Fields" });
  }

  try {
    const chatId = [username, receipientID].sort().join("_");
    const chatDocument = chatCollection.doc(chatId);
    await chatDocument.set({
      users: [username, receipientID].sort(),
      lastUpdated: Timestamp.now(),
    });

    const messagesCollection = chatDocument.collection("messages");

    await messagesCollection.add({
      senderId: userId,
      senderName: username,
      text,
      imageUrl: imageUrl,

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

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const { username } = await clerkClient.users.getUser(userId);

  if (!receiverId) return res.status(400).json({ error: "Missing receiverId" });
  const chatId = [username, receiverId].sort().join("_");
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

type MessageType = {
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  timestamp: any;
};

const getAllChats = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const { username } = await clerkClient.users.getUser(userId);

  try {
    const chatQuerySnapshot = await db
      .collection("chats")
      .where("users", "array-contains", username)
      .get();
    let docs = chatQuerySnapshot.docs;

    let allMessages = [];
    for (const doc of docs) {
      const chatData = doc.data();
      const otherUser = chatData.users.find((user: string) => user != username);

      const messageCollectionRef = doc.ref.collection("messages");
      const messageSnapshot = await messageCollectionRef
        .orderBy("timestamp")
        .limit(1)
        .get();

      const chatMessages: MessageType[] = [];
      messageSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          chatMessages.push(data as MessageType);
        }
      });

      allMessages.push({ chatWith: otherUser, messages: chatMessages });
    }
    res.json({ allMessages });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to fetch chats");
  }
};

router.get("/get-user-chats", getAllChats);
router.post("/send-texts", sendMessages);
router.get("/get-texts", getMessages);

export default router;
