const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const updatedStatus = req.body.status;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    user.status = updatedStatus;

    const result = await user.save();

    return res
      .status(201)
      .json({ message: "Status Updated!", status: result.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;

  try {
    const count = await Post.find().countDocuments();

    totalItems = count;
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
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
    const post = await Post.findById(postId).populate("creator");

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
    const creator = await User.findById(req.userId);

    if (!creator) {
      const error = new Error("User not found in db.");
      error.statusCode = 404;
      return next(error);
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      creator: req.userId,
    });

    const result = await post.save();

    creator.posts.push(result._id);
    await creator.save();

    io.getIO().emit("posts", {
      action: "create",
      post: {
        ...result._doc,
        creator: { _id: req.userId, name: creator.name },
      },
    });

    return res.status(201).json({
      message: "Post created successfully",
      post: result,
      creator: { _id: creator._id, name: creator.name },
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
    const post = await Post.findById(postId).populate("creator");

    let result;

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      return next(error);
    }

    post.title = updatedTitle;
    post.content = updatedContent;

    if (image) {
      clearImage(post.imageUrl);
      post.imageUrl = image.path.replace("\\", "/");
    }

    result = await post.save();

    io.getIO().emit("posts", {
      action: "update",
      post: {
        ...result._doc,
        creator: { _id: req.userId, name: post.creator.name },
      },
    });

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
    const creator = await User.findById(post.creator);

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      return next(error);
    }

    clearImage(post.imageUrl);

    await Post.findByIdAndDelete(postId);

    creator.posts.pull(postId);
    await creator.save();

    io.getIO().emit("posts", {
      action: "delete",
      post: postId
    });

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
