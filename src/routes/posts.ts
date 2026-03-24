import express from "express";
import axios from "axios";
import {
  addPost,
  getAllPosts,
  getUserPosts,
  deleteUserPost,
  updatePostStatus,
} from "../controllers/postsControllerFirebase";
const router = express.Router();
router.post("/", addPost);
router.get("/", getAllPosts);
router.get("/userPosts", getUserPosts);
router.patch("/:postId/status", updatePostStatus);
router.delete("/:postId", deleteUserPost);

router.get("/geocode", async (req: any, res: any) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng are required" });
  }
  try {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}%2C+${lng}&key=${apiKey}`
    );
    res.json((response.data as any).results[0].components);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

export default router;
