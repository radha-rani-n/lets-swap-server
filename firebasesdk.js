"use strict";
// firebase.ts or firebaseAdmin.ts
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
exports.admin = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const express_1 = __importDefault(require("express"));
const serviceAccountKey_json_1 = __importDefault(require("./serviceAccountKey.json"));
const router = express_1.default.Router();
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccountKey_json_1.default),
        databaseURL: "https://lets-swap-576ce.firebaseio.com",
    });
}
const db = firebase_admin_1.default.firestore();
exports.db = db;
const chatCollection = db.collection("chatMessages");
chatCollection.orderBy("timestamp").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            console.log("📩 New message:", change.doc.data());
        }
    });
});
// Route to send a message
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, text } = req.body;
    try {
        yield chatCollection.add({
            user,
            text,
            timestamp: Date.now(),
        });
        res.status(200).send("Message sent!");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Failed to send message");
    }
});
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield chatCollection.get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const messages = snapshot.docs.map((doc) => {
            return Object.assign({ id: doc.id }, doc.data());
        });
        res.status(200).json(messages);
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to fetch messages");
    }
});
router.get("/get-messages", getMessages);
router.post("/send-message", sendMessage);
exports.default = router;
