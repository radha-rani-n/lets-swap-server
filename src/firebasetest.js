"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const firestore_1 = require("firebase-admin/firestore");
const router = express_1.default.Router();
const express_3 = require("@clerk/express");
const firebase_1 = require("./firebase");
const chatCollection = firebase_1.db.collection("chats");
const getUserId = (req) => {
    const { userId } = (0, express_3.getAuth)(req);
    return userId !== null && userId !== void 0 ? userId : null;
};
const sendMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }
    const { username } = yield express_2.clerkClient.users.getUser(userId);
    const { text, receipientID, imageUrl, replyTo } = req.body;
    if (!receipientID || !text) {
        return res.status(400).json({ error: "Missing Fields" });
    }
    try {
        const chatId = [username, receipientID].sort().join("_");
        const chatDocument = chatCollection.doc(chatId);
        yield chatDocument.set({
            users: [username, receipientID].sort(),
            lastUpdated: firestore_1.Timestamp.now(),
        });
        const messagesCollection = chatDocument.collection("messages");
        const messageData = {
            senderId: userId,
            senderName: username,
            text,
            imageUrl: imageUrl,
            timestamp: firestore_1.Timestamp.now(),
        };
        if (replyTo) {
            messageData.replyTo = replyTo;
        }
        yield messagesCollection.add(messageData);
        res.status(200).json({ message: "Message Sent", chatId });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Failed to send message");
    }
});
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiverId } = req.query;
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }
    const { username } = yield express_2.clerkClient.users.getUser(userId);
    if (!receiverId)
        return res.status(400).json({ error: "Missing receiverId" });
    const chatId = [username, receiverId].sort().join("_");
    try {
        const snapshot = yield chatCollection
            .doc(chatId)
            .collection("messages")
            .orderBy("timestamp")
            .get();
        const messages = snapshot.docs.map((doc) => {
            return Object.assign({ id: doc.id }, doc.data());
        });
        res.status(200).json({ chatId, messages });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to fetch messages");
    }
});
const getAllChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }
    const { username } = yield express_2.clerkClient.users.getUser(userId);
    try {
        const chatQuerySnapshot = yield firebase_1.db
            .collection("chats")
            .where("users", "array-contains", username)
            .get();
        let docs = chatQuerySnapshot.docs;
        let allMessages = [];
        for (const doc of docs) {
            const chatData = doc.data();
            const otherUser = chatData.users.find((user) => user != username);
            const messageCollectionRef = doc.ref.collection("messages");
            const messageSnapshot = yield messageCollectionRef
                .orderBy("timestamp")
                .limit(1)
                .get();
            const chatMessages = [];
            messageSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data) {
                    chatMessages.push(data);
                }
            });
            allMessages.push({ chatWith: otherUser, messages: chatMessages });
        }
        res.json({ allMessages });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to fetch chats");
    }
});
const editMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }
    const { username } = yield express_2.clerkClient.users.getUser(userId);
    const { chatWith, messageId, text } = req.body;
    if (!chatWith || !messageId || !text) {
        return res.status(400).json({ error: "Missing fields" });
    }
    try {
        const chatId = [username, chatWith].sort().join("_");
        const messageRef = chatCollection
            .doc(chatId)
            .collection("messages")
            .doc(messageId);
        const messageDoc = yield messageRef.get();
        if (!messageDoc.exists) {
            return res.status(404).json({ error: "Message not found" });
        }
        if (((_a = messageDoc.data()) === null || _a === void 0 ? void 0 : _a.senderName) !== username) {
            return res.status(403).json({ error: "Can only edit your own messages" });
        }
        yield messageRef.update({ text, edited: true });
        res.status(200).json({ message: "Message edited" });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to edit message");
    }
});
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }
    const { username } = yield express_2.clerkClient.users.getUser(userId);
    const { chatWith, messageId } = req.body;
    if (!chatWith || !messageId) {
        return res.status(400).json({ error: "Missing fields" });
    }
    try {
        const chatId = [username, chatWith].sort().join("_");
        const messageRef = chatCollection
            .doc(chatId)
            .collection("messages")
            .doc(messageId);
        const messageDoc = yield messageRef.get();
        if (!messageDoc.exists) {
            return res.status(404).json({ error: "Message not found" });
        }
        if (((_a = messageDoc.data()) === null || _a === void 0 ? void 0 : _a.senderName) !== username) {
            return res
                .status(403)
                .json({ error: "Can only delete your own messages" });
        }
        yield messageRef.update({
            text: "",
            imageUrl: null,
            deleted: true,
        });
        res.status(200).json({ message: "Message deleted" });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to delete message");
    }
});
router.get("/get-user-chats", getAllChats);
router.post("/send-texts", sendMessages);
router.get("/get-texts", getMessages);
router.patch("/edit-message", editMessage);
router.patch("/delete-message", deleteMessage);
exports.default = router;
