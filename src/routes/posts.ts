import express from "express";
import {
  addPost,
  getAllPosts,
  getUserPosts,
} from "../controllers/postsControllerFirebase";
const router = express.Router();
router.post("/", addPost);
router.get("/", getAllPosts);
router.get("/userPosts", getUserPosts);
export default router;
