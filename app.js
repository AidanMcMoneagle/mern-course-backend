const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");
const placesRoutes = require("./routes/places-routes"); // import placesRoutes
const userRoutes = require("./routes/user-routes");

const app = express();

//on every request parses req.body
app.use(bodyParser.json()); // on every request parses the req.body and extracts json data and converts to regualr JS data structure. Will then call next automatically

app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "uploads/images"))
);

// attach headers to every response we send (to eliminate CORS error). Later when send a response from more specific routes we already have the headers attached.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // controls which domains have access. * allows any domain to send requests.
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE"); // controls which HTTP methods may be allowed when accessing a resource.

  next();
});

// to hit placesRoutes path request must start with /api/places
app.use("/api/places", placesRoutes);

// user routes
app.use("/api/users", userRoutes);

// this route will only be hit if no other routes are matched above. Used to throw an error when we are trying to access a route that is not supported
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error; // error is thrown will hit error handling middleware.
});

// default error handler. error handling middleware function. function will run when any middleware infront throws an error.
app.use((error, req, res, next) => {
  // if there has been an error whilst signing up we want to remove the file (image) that has been added. Multer adds a file property to request object
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(err);
  }
  res.status(error.statuscode || 500);
  res.json({ message: error.message || "An unkown error occured" });
});

// connect backend to mongo db database
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sdfi1cf.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000, () => {
      console.log("listening on port 5000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
