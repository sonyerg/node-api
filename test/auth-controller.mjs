import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";

import User from "../models/user.js";
import AuthController from "../controllers/auth.js";

describe("Auth controller - Login", () => {
  it("should throw an error if it failed accessing the database", (done) => {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "test@test.com",
        password: "secretpassword",
      },
    };

    AuthController.login(req, {}, () => {}).then((result) => {
      expect(result).to.be.an("error");
      expect(result).to.have.property("statusCode", 500);
      done();
    });

    User.findOne.restore();
  });
});
