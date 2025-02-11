const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();

    return next(error);
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    const result = await user.save();

    return res
      .status(201)
      .json({ message: "User created successfully!", userId: result._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      return next(error);
    }

    const doMatch = await bcrypt.compare(password, user.password);

    if (!doMatch) {
      const error = new Error("Wrong email or password.");
      error.statusCode = 401;

      return next(error);
    }

    const token = jwt.sign(
      { email, userId: user._id.toString() },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token, userId: user._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    return next(err);
  }
};
