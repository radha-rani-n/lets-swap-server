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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostStatus = exports.deleteUserPost = exports.getUserPosts = exports.getAllPosts = exports.addPost = void 0;
const express_1 = require("@clerk/express");
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
const postCollection = firebase_1.db.collection("posts");
const addPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.auth.userId;
    const user = yield express_1.clerkClient.users.getUser(userId);
    const { postId, caption, plantImageUrl, locationLatitude, locationLongitude, } = req.body;
    if (!plantImageUrl || !locationLatitude || !locationLongitude || !postId) {
        return res.status(400).json({ error: "some data is missing" });
    }
    try {
        yield postCollection.add({
            userName: user.username,
            postId: postId,
            caption: caption,
            plantImageUrl: plantImageUrl,
            locationLatitude: locationLatitude,
            locationLongitude: locationLongitude,
            status: "available",
            timestamp: firestore_1.Timestamp.now(),
        });
        res.status(200).json({ messages: "Post added successfully", postId });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to add post");
    }
});
exports.addPost = addPost;
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield postCollection.orderBy("timestamp").get();
        const allPosts = snapshot.docs.map((doc) => {
            return Object.assign({}, doc.data());
        });
        res.status(200).json(allPosts);
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to get posts");
    }
});
exports.getAllPosts = getAllPosts;
const getUserPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.auth.userId;
    const user = yield express_1.clerkClient.users.getUser(userId);
    const username = user.username;
    if (!username) {
        return res.status(400).json({ error: "Username not found for the user" });
    }
    try {
        const userPostsSnapShot = yield postCollection
            .orderBy("timestamp")
            .where("userName", "==", username)
            .get();
        const userPosts = userPostsSnapShot.docs.map((doc) => {
            return Object.assign({}, doc.data());
        });
        res.status(200).json(userPosts);
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Failed to get user posts");
    }
});
exports.getUserPosts = getUserPosts;
const deleteUserPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.auth.userId;
    const user = yield express_1.clerkClient.users.getUser(userId);
    const username = user.username;
    if (!username) {
        return res.status(400).json({ error: "Username not found for the user" });
    }
    try {
        const { postId } = req.params;
        const postSnapshot = yield postCollection
            .where("postId", "==", postId)
            .where("userName", "==", username)
            .get();
        if (postSnapshot.empty) {
            return res.status(404).json({ error: "Post not found" });
        }
        const postDoc = postSnapshot.docs[0];
        yield postDoc.ref.delete();
        return res.status(200).json({ message: "Post deleted successfully" });
    }
    catch (e) {
        res.status(500).json({
            error: `Error deleting post ${req.params.postId}: ${e.message}`,
        });
    }
});
exports.deleteUserPost = deleteUserPost;
const updatePostStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.auth.userId;
    const user = yield express_1.clerkClient.users.getUser(userId);
    const username = user.username;
    if (!username) {
        return res.status(400).json({ error: "Username not found for the user" });
    }
    const { postId } = req.params;
    const { status } = req.body;
    const validStatuses = ["available", "reserved", "swapped"];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
    }
    try {
        const postSnapshot = yield postCollection
            .where("postId", "==", postId)
            .where("userName", "==", username)
            .get();
        if (postSnapshot.empty) {
            return res.status(404).json({ error: "Post not found" });
        }
        const postDoc = postSnapshot.docs[0];
        yield postDoc.ref.update({ status });
        return res
            .status(200)
            .json({ message: "Post status updated successfully", status });
    }
    catch (e) {
        res.status(500).json({
            error: `Error updating post status: ${e.message}`,
        });
    }
});
exports.updatePostStatus = updatePostStatus;
