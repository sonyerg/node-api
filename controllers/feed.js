const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find();

    return res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    return res.status(501).json({ message: "Error 501", error: err });
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Invalid data", errors: errors.array() });
  }

  const title = req.body.title;
  const content = req.body.content;

  try {
    const post = new Post({
      title,
      content,
      imageUrl: "",
      creator: { name: "Erickson1" },
    });

    const result = await post.save();

    return res.status(201).json({
      message: "Post created successfully",
      post: result,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(501)
      .json({ message: "Error 501:", errors: errors.array() });
  }
};
