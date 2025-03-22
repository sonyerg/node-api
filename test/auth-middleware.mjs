import { expect } from "chai";
import { describe } from "mocha";
import jwt from "jsonwebtoken";
import sinon from "sinon";

import authMiddleware from "../middleware/is-auth.js";

describe("Auth Middleware", () => {
  it("should throw an error if no auth header is present", () => {
    const req = {
      get: () => {
        return null;
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
      "Unauthenticated."
    );
  });

  it("should throw an error if auth header has only one string", () => {
    const req = {
      get: () => {
        return "xyz";
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it("should throw an error if the token cannot be verified", () => {
    const req = {
      get: () => {
        return "Bearer xyz";
      },
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it("should yield a userId after decoding the token", () => {
    const req = {
      get: () => {
        return "Bearer xyz";
      },
    };

    sinon.stub(jwt, "verify");

    jwt.verify.returns({ userId: "abc" });

    authMiddleware(req, {}, () => {});

    expect(req).to.have.property("userId");
    expect(req).to.have.property("userId", "abc");
    expect(jwt.verify.called).to.be.true;

    jwt.verify.restore();
  });
});
