const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email", "Please enter a valid email address")
      .isEmail()
      .normalizeEmail()
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          return Promise.reject("Email address is already taken.");
        }

        return true;
      }),
    body("password", "Enter a valid password").trim().isLength({ min: 5 }),
    body("name", "Enter name")
      .trim()
      .isLength({ max: 50, min: 5 })
      .not()
      .isEmpty(),
  ],
  authController.signup
);

module.exports = router;
