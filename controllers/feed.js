const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find();

    return res.status(200).json(posts);
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
