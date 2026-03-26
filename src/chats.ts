import express from "express";
import { clerkClient } from "@clerk/express";
const router = express.Router();
import { getAuth } from "@clerk/express";
import prisma from "./prisma";

const GUEST_USERNAME = "guest_user";
const GUEST_USER_ID = "guest";

const getUserId = (req: any): string | null => {
  const { userId } = getAuth(req);
  return userId ?? GUEST_USER_ID;
};

const getUsername = async (userId: string): Promise<string> => {
  if (userId === GUEST_USER_ID) return GUEST_USERNAME;
  const { username } = await clerkClient.users.getUser(userId);
  return username!;
};

const sendMessages = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const username = await getUsername(userId);

  const { text, receipientID, imageUrl, replyTo } = req.body;

  if (!receipientID || !text) {
    return res.status(400).json({ error: "Missing Fields" });
  }

  try {
    const chatId = [username, receipientID].sort().join("_");

    await prisma.chat.upsert({
      where: { chatId },
      update: { lastUpdated: new Date() },
      create: {
        chatId,
        users: [username, receipientID].sort(),
      },
    });

    const messageData: any = {
      chatId,
      senderId: userId,
      senderName: username,
      text,
      imageUrl: imageUrl || null,
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    await prisma.message.create({ data: messageData });

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
  const username = await getUsername(userId);

  if (!receiverId) return res.status(400).json({ error: "Missing receiverId" });
  const chatId = [username, receiverId].sort().join("_");
  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: "asc" },
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
  imageUrl?: string | null;
  timestamp: Date;
};

const getAllChats = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const username = await getUsername(userId);

  try {
    const chats = await prisma.chat.findMany({
      where: { users: { has: username! } },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
          take: 1,
        },
      },
    });

    const allMessages = chats.map((chat) => {
      const otherUser = chat.users.find((user: string) => user !== username);
      return {
        chatWith: otherUser,
        messages: chat.messages as MessageType[],
      };
    });

    res.json({ allMessages });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to fetch chats");
  }
};

const editMessage = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const username = await getUsername(userId);
  const { chatWith, messageId, text } = req.body;

  if (!chatWith || !messageId || !text) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const chatId = [username, chatWith].sort().join("_");
    const message = await prisma.message.findFirst({
      where: { id: parseInt(messageId), chatId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.senderName !== username) {
      return res.status(403).json({ error: "Can only edit your own messages" });
    }

    await prisma.message.update({
      where: { id: message.id },
      data: { text, edited: true },
    });
    res.status(200).json({ message: "Message edited" });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to edit message");
  }
};

const deleteMessage = async (req: any, res: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found" });
  }
  const username = await getUsername(userId);
  const { chatWith, messageId } = req.body;

  if (!chatWith || !messageId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const chatId = [username, chatWith].sort().join("_");
    const message = await prisma.message.findFirst({
      where: { id: parseInt(messageId), chatId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.senderName !== username) {
      return res
        .status(403)
        .json({ error: "Can only delete your own messages" });
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        text: "",
        imageUrl: null,
        deleted: true,
      },
    });
    res.status(200).json({ message: "Message deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to delete message");
  }
};

router.get("/get-user-chats", getAllChats);
router.post("/send-texts", sendMessages);
router.get("/get-texts", getMessages);
router.patch("/edit-message", editMessage);
router.patch("/delete-message", deleteMessage);

export default router;
