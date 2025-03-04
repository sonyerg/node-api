const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

module.exports = {
  createUser: async ({ userInput }, req) => {
    // const email = userInput.email;

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
  },
};
