const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  console.log(currentPage);
  const perPage = 2;
  let totalItems;

  try {
    const count = await Post.find().countDocuments();

    totalItems = count;
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return res.status(200).json({ posts, totalItems });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Post unavailable");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({ post, message: "Post fetched!" });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    next(error);
  }

  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    next(error);
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\", "/");

  try {
    const post = new Post({
      title,
      content,
      imageUrl,
      creator: { name: "Erickson1" },
    });

    const result = await post.save();

    return res.status(201).json({
      message: "Post created successfully",
      post: result,
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    return next(error);
  }

  const updatedTitle = req.body.title;
  const updatedContent = req.body.content;
  const image = req.file;

  try {
    const post = await Post.findById(postId);

    let result;

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    post.title = updatedTitle;
    post.content = updatedContent;

    if (image) {
      clearImage(post.imageUrl);
      post.imageUrl = image.path.replace("\\", "/");
      result = await post.save();
    } else {
      result = await post.save();
    }

    return res
      .status(200)
      .json({ message: "Post updated successfully!", post: result });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    clearImage(post.imageUrl);

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({ message: "Post deleted successfully!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) console.log(err);
  });
};
