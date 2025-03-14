const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");
const { clearImage } = require("../utils/file");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const errors = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Invalid email" });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Invalid password." });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    try {
      const existingUser = await User.findOne({ email: userInput.email });

      if (existingUser) {
        const error = new Error("Email is already taken");
        throw error;
      }

      const hashedPw = await bcrypt.hash(userInput.password, 12);

      const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPw,
      });

      const createdUser = await user.save();

      return { ...createdUser._doc, _id: createdUser._id.toString() };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },

  createPost: async ({ postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Unauthorized");
      error.code = 401;
      throw error;
    }

    const errors = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is invalid" });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    try {
      const user = await User.findById(req.userId);

      if (!user) {
        const error = new Error("Invalid User");
        error.code = 401;
        throw error;
      }

      const post = new Post({
        title: postInput.title,
        content: postInput.content,
        imageUrl: postInput.imageUrl,
        creator: user,
      });

      const createdPost = await post.save();

      user.posts.push(createdPost._id);
      await user.save();

      return {
        ...createdPost._doc,
        _id: createdPost._id.toString(),
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: createdPost.updatedAt.toISOString(),
      };
    } catch (error) {
      error.code = 500;
      throw error;
    }
  },

  login: async ({ email, password }) => {
    try {
      const user = await User.findOne({ email: email });

      if (!user) {
        const error = new Error("User not found");
        error.code = 401;
        throw error;
      }

      const doMatch = await bcrypt.compare(password, user.password);

      if (!doMatch) {
        const error = new Error("Email or password invalid!");
        error.code = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );

      return { token, userId: user._id.toString() };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },

  posts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error("Unauthorized");
      error.code = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;

    try {
      const totalPosts = await Post.find().countDocuments();
      const posts = await Post.find()
        .populate("creator")
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);

      // For graphql to understand:
      const mappedPosts = posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      });

      return { posts: mappedPosts, totalPosts };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },

  post: async ({ postId }, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthorized");
    }

    try {
      const post = await Post.findById(postId).populate("creator");

      if (!post) {
        const error = new Error("Post unavailable");
        error.code = 404;
        throw error;
      }

      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
      };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },

  editPost: async ({ postInput, postId }, req) => {
    if (!req.isAuth) {
      const error = new Error("Unauthorized");
      error.code = 401;
      throw error;
    }

    const errors = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is invalid" });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    try {
      const post = await Post.findById(postId).populate("creator");

      if (!post) {
        const error = new Error("Post unavailable");
        error.code = 404;
        throw error;
      }

      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Unauthorized");
        error.code = 403;
        throw error;
      }

      post.title = postInput.title;
      post.content = postInput.content;
      if (postInput.imageUrl !== undefined) {
        post.imageUrl = postInput.imageUrl;
      }

      const updatedPost = await post.save();

      return {
        ...updatedPost._doc,
        _id: updatedPost._id.toString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
        createdAt: updatedPost.createdAt.toISOString(),
      };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },

  deletePost: async ({ postId }, req) => {
    if (!req.isAuth) {
      const error = new Error("Unauthorized");
      error.code = 401;
      throw error;
    }

    try {
      const post = await Post.findById(postId);

      if (!post) {
        const error = new Error("Post unavailable");
        error.code = 404;
        throw error;
      }

      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Unauthorized");
        error.code = 403;
        throw error;
      }

      clearImage(post.imageUrl);
      await Post.findByIdAndDelete(postId);

      const user = await User.findById(post.creator);
      user.posts.pull(postId);
      await user.save();

      return true;
    } catch (error) {
      console.log("Error Delete Post", error);
      return false;
    }
  },

  user: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error("Unauthorized");
      error.code = 401;
      throw error;
    }

    try {
      const user = await User.findById(req.userId);

      if (!user) {
        const error = new Error("No user found");
        error.code = 404;
        throw error;
      }

      return { ...user._doc, _id: user._id.toString() };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },

  updateStatus: async ({ status }, req) => {
    if (!req.isAuth) {
      const error = new Error("Unauthorized");
      error.code = 401;
      throw error;
    }

    try {
      const user = await User.findById(req.userId);

      if (!user) {
        error.code = 404;
        throw error;
      }

      user.status = status;
      await user.save();

      return { ...user._doc, _id: user._id.toString() };
    } catch (err) {
      const error = new Error("Internal server error");
      error.code = 500;
      throw error;
    }
  },
};
