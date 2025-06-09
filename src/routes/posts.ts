import express from "express";
import {
  addPost,
  getAllPosts,
  getUserPosts,
  deleteUserPost,
} from "../controllers/postsControllerFirebase";
const router = express.Router();
router.post("/", addPost);
router.get("/", getAllPosts);
router.get("/userPosts", getUserPosts);
router.delete("/:postId", deleteUserPost);
export default router;
