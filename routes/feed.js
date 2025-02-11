const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

router.get("/posts", isAuth, feedController.getPosts);

router.get("/post/:postId", feedController.getPost);

router.post(
  "/post",
  [
    body("title").isString().isLength({ min: 5, max: 100 }).trim(),
    body("content").isLength({ min: 5, max: 200 }).trim(),
  ],
  feedController.createPost
);

router.put(
  "/post/:postId",
  [
    body("title").isString().isLength({ min: 5, max: 100 }).trim(),
    body("content").isLength({ min: 5, max: 200 }).trim(),
  ],
  feedController.updatePost
);

router.delete("/post/:postId", feedController.deletePost);

module.exports = router;
