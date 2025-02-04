const { validationResult } = require("express-validator");

exports.getPosts = (req, res, next) => {
  // TODO: fetch from db
  res.status(200).json([
    {
      _id: "123",
      title: "First post",
      content: "This is post",
      imageUrl: "images/srpj11.jpg",
      creator: {
        name: "Erickson",
      },
      createdAt: new Date(),
    },
  ]);
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Invalid data", errors: errors.array() });
  }

  const title = req.body.title;
  const content = req.body.content;

  // TODO: create post in db
  res.status(201).json({
    message: "Post created successfully",
    post: {
      _id: new Date().toISOString(),
      title,
      content,
      creator: { name: "Erickson" },
      createdAt: new Date(),
    },
  });
};
