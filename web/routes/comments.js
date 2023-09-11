import { Router } from "express";
import commentHandler from "../utils/commentHandler.js";
const commentsRoute = Router();
commentsRoute.post("/comments", async (req, res) => {
  try {
    const comment = commentHandler.storeCommentProduct(req.body);
    await comment.save();
    res.status(201).json({ mensaje: "Comment added" });
  } catch (error) {
    res.status(500).json({ error: "It wasn't possible to add comment" });
  }
});

commentsRoute.get("/comments/:productId", async (req, res) => {
  try {
    commentHandler.getCommentsProduct(req.params.productId);
    res.status(200).json(comentarios);
  } catch (error) {
    console.error(
      `---> Error while getting comments for id  product${req.params.productId}`,
      e
    );
    if (!res.headersSent) {
      res.status(500).send(error.message);
    }
  }
});

export default commentsRoute;
