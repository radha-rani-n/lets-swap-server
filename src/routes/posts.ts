import express from "express";
import { addPost, getAllPosts } from "../controllers/postsControllerFirebase";
const router = express.Router();
router.post("/", addPost);
router.get("/", getAllPosts);
export default router;
