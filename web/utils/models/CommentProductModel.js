import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  productId: String,
  nameCustomer: String,
  content: String,
  rate: Number,
});
const CommentProductModel = mongoose.model("Comment_Product", commentSchema);

export default CommentProductModel;