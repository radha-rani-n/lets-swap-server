import express from "express";

const router = express.Router();

type postProps = {
  post_url: string;
};

const addPost = async (req: any, res: any) => {
  const { post_url }: postProps = req.body;
  if (!post_url) {
    return res.status(400).json({ error: "Post url is required" });
  }
};
