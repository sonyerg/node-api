const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    if (!decodedToken) {
      req.isAuth = false;
      return next();
    }

    req.userId = decodedToken.userId;
    req.isAuth = true;

    return next();
  } catch (err) {
    req.isAuth = false;
    return next();
  }
};
