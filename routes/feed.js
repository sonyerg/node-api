const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

router.get("/posts", isAuth, feedController.getPosts);

router.get("/post/:postId", isAuth, feedController.getPost);

router.get("/status", isAuth, feedController.getStatus);

router.patch(
  "/status",
  isAuth,
  [body("status").trim().not().isEmpty()],
  feedController.updateStatus
);

router.post(
  "/post",
  [
    body("title").isString().isLength({ min: 5, max: 100 }).trim(),
    body("content").isLength({ min: 5, max: 200 }).trim(),
  ],
  isAuth,
  feedController.createPost
);

router.put(
  "/post/:postId",
  [
    body("title").isString().isLength({ min: 5, max: 100 }).trim(),
    body("content").isLength({ min: 5, max: 200 }).trim(),
  ],
  isAuth,
  feedController.updatePost
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
