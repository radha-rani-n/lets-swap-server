// firebase.ts or firebaseAdmin.ts

import admin from "firebase-admin";
import express from "express";
import serviceAccount from "./serviceAccountKey.json";
import { error } from "console";
const router = express.Router();
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "https://lets-swap-576ce.firebaseio.com",
  });
}

const db = admin.firestore();
const chatCollection = db.collection("chatMessages");
export { db, admin };
chatCollection.orderBy("timestamp").onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      console.log("📩 New message:", change.doc.data());
    }
  });
});

// Route to send a message
const sendMessage = async (req: any, res: any) => {
  const { user, text } = req.body;

  try {
    await chatCollection.add({
      user,
      text,
      timestamp: Date.now(),
    });
    res.status(200).send("Message sent!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send message");
  }
};

const getMessages = async (req: any, res: any) => {
  try {
    const snapshot = await chatCollection.get();
    if (snapshot.empty) {
      return res.status(200).json([]);
    }
    const messages = snapshot.docs.map((doc: any) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    res.status(200).json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to fetch messages");
  }
};
router.get("/get-messages", getMessages);
router.post("/send-message", sendMessage);
export default router;
