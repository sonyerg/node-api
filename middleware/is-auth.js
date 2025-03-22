const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    req.isAuth = false;

    const error = new Error("Unauthenticated.");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    if (!decodedToken) {
      req.isAuth = false;

      const error = new Error("Unauthenticated.");
      error.statusCode = 401;
      throw error;
    }

    req.userId = decodedToken.userId;
    req.isAuth = true;

    return next();
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
};
