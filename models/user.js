const mongooes = require("mongoose");

const Schema = mongooes.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: { type: String, required: true },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Hello world!",
  },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
});

module.exports = mongooes.model("User", userSchema);
