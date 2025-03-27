import { expect } from "chai";
import { describe } from "mocha";
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/user.js";
import FeedController from "../controllers/feed.js";

dotenv.config();

describe("Feed Controller - Status", () => {
  before((done) => {
    mongoose
      .connect(process.env.MONGODB_TEST_URI)
      .then(() => {
        console.log("Connected to MongoDB");
        return done();
      })
      .catch((err) => done(err));
  });

  let userId;
  beforeEach((done) => {
    const user = new User({
      email: "test@etst.com",
      password: "testpassword",
      name: "Test Account",
      posts: [],
      _id: "67dbd3be3257aa69a09db110",
    });

    user
      .save()
      .then((user) => {
        userId = user._id;
        done();
      })
      .catch((err) => done(err));
  });

  it("should send a response with a valid user status for an existing user", (done) => {
    const req = { userId };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };

    FeedController.getStatus(req, res, () => {})
      .then(() => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.userStatus).to.be.equal("Hello world!");
        done();
      })
      .catch((err) => done(err));
  });

  afterEach((done) => {
    User.deleteMany({})
      .then(() => {
        done();
      })
      .catch((err) => done(err));
  });

  after((done) => {
    mongoose
      .disconnect()
      .then(() => {
        console.log("Disconnected from MongoDB");
        done();
      })
      .catch((err) => done(err));
  });
});
