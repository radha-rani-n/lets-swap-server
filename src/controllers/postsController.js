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
const prisma_1 = require("../../generated/prisma");
const express_2 = require("@clerk/express");
const prisma = new prisma_1.PrismaClient();
const router = express_1.default.Router();
const firebase_1 = require("../firebase");
const postCollection = firebase_1.db.collection("posts");
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allPosts = yield prisma.post.findMany();
        res.status(200).json(allPosts);
    }
    catch (e) {
        console.error(e);
    }
});
const getUserPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.auth.userId;
    const user = yield express_2.clerkClient.users.getUser(userId);
    const username = user.username;
    if (!username) {
        return res.status(400).json({ error: "Username not found for the user" });
    }
    try {
        const userPosts = yield prisma.post.findMany({
            where: { userName: user.username },
        });
        res.status(200).json(userPosts);
    }
    catch (e) {
        console.error(e);
    }
});
const addPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.auth.userId;
    const user = yield express_2.clerkClient.users.getUser(userId);
    const { postId, caption, plantImageUrl, locationLatitude, locationLongitude, } = req.body;
    if (!plantImageUrl || !locationLatitude || !locationLongitude || !postId) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const addNewPost = yield prisma.post.create({
            data: {
                userName: (_a = user.username) !== null && _a !== void 0 ? _a : "",
                plantImageUrl,
                locationLatitude,
                locationLongitude,
                postId,
                caption,
            },
        });
        res.status(200).json(addNewPost);
    }
    catch (e) {
        res.status(400).json({ error: `Error adding new post ${e.message}` });
    }
    finally {
        yield prisma.$disconnect();
    }
});
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.auth.userId;
    const user = yield express_2.clerkClient.users.getUser(userId);
    try {
        const { postId } = req.params;
        const post = yield prisma.post.findUnique({
            where: { postId: postId, userName: (_a = user.username) !== null && _a !== void 0 ? _a : undefined },
        });
        if (!post) {
            return res.status(404).json({ error: `Post ID ${postId} not found` });
        }
        yield prisma.post.delete({
            where: { userName: (_b = user.username) !== null && _b !== void 0 ? _b : "", postId: postId },
        });
        res.status(200).json({ Message: "Post deleted successfully" });
    }
    catch (e) {
        res.status(500).json({
            error: `Error deleting post ${req.params.postProps}: ${e.message}`,
        });
    }
});
router.get("/", getAllPosts);
router.get("/userPosts", getUserPosts);
router.post("/", addPost);
router.delete("/:postId", deletePost);
exports.default = router;
