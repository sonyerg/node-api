import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import User from "../models/user.js";
import AuthController from "../controllers/auth.js";

describe("Auth controller - Login", () => {
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
      email: "test@test.com",
      password: "testpassword",
      name: "Test Account",
      posts: [],
      _id: "67dbd3be3257aa69a09db110",
    });

    user
      .save()
      .then((user) => {
        console.log("User created!");
        userId = user._id;
        done();
      })
      .catch((err) => done(err));
  });

  it("should throw an error if it failed accessing the database", (done) => {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "test@test.com",
        password: "secretpassword",
      },
    };

    const res = {
      statusCode: 500,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
    };

    const next = (error) => {
      expect(error).to.be.an("error");
      expect(error).to.have.property("statusCode", 500);
      User.findOne.restore();
      done();
    };
    
    AuthController.login(req, res, next);
  });

  it("should return a token after successfully logging in", (done) => {
    const req = {
      body: {
        email: "test@test.com",
        password: "testpassword",
      },
    };

    const res = {
      statusCode: 500,
      token: null,
      userId: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.token = data.token;
        this.userId = data.userId;
        return this;
      },
    };

    const next = (error) => {
      if (error) {
        done(error);
      }
    };

    sinon.stub(jwt, "sign").returns("mockToken");
    sinon.stub(bcrypt, "compare").resolves(true);

    AuthController.login(req, res, next)
      .then(() => {
        expect(res.statusCode).to.equal(200);
        expect(res.token).to.equal("mockToken");
        expect(res.userId).to.equal(userId.toString());
        jwt.sign.restore();
        bcrypt.compare.restore();
        done();
      })
      .catch((err) => {
        jwt.sign.restore();
        bcrypt.compare.restore();
        done(err);
      });
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
