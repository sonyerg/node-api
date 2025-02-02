exports.getPosts = (req, res, next) => {
  res.status(200).json([{ title: "First post", content: "This is post" }]);
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  // TODO: create post in db
  res.status(201).json({
    message: "Post created successfully",
    post: {
      id: new Date().toISOString(),
      title,
      content,
    },
  });
};
