const bcrypt = require("bcrypt");

const User = require("../models/user");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const email = userInput.email;

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

  hello: () => {
    return "Hello World";
  },
};
