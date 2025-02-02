const express = require("express");

const feedRoutes = require("./routes/feed");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Allow-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Allow-Control-Allow-Headers", "Content-Type, Authorization");

  next();
});

app.use("/feed", feedRoutes);

app.listen(8080);
