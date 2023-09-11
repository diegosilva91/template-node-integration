import CommentProductModel from "./models/CommentProductModel.js";
const storeCommentProduct = async () => {
  const CommentProduct = CommentProductModel(req.body);
  await CommentProduct.save();
  return true;
};

const getCommentsProduct = async (id) => {
  const comments = await CommentProductModel.find({
    productId: id,
  });
  if (comments === null) {
    return undefined;
  }
  if (comments.content.length > 0) {
    res.status(200).json(comments);
  }

  return undefined;
};

const deleteCommentsProduct = async (id) => {
  const _CommentProduct = await CommentProductModel.deleteMany({ id });
  return true;
};
const commentHandler = {
  storeCommentProduct,
  getCommentsProduct,
  deleteCommentsProduct,
};

export default commentHandler;
