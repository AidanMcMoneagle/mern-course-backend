const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    // find all users but does not select the password field
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed please try again later",
      500
    );
    return next(error);
  }
  // users is an array of mongoose object need to map over array and convert each mongoose object to JS object, using toObject mongoose methid.  setting getters: true will add id field to object same as _id.
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

// need to ensure we cannot create user without all fields being present.
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Could not create user, invalid inputs", 422);
    return next(error);
  }

  const { name, password, email } = req.body;

  // checking to see if email already exists. Custom error handling. Still have this validation within the user schema.
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    //will throw error if something went wrong with the findOne method. We just use try catch here as good practice whilst carrying out async operations.
    const error = new HttpError("Signup failed please try again later", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "Could not create user, user already exists",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (e) {
    const error = new HttpError("Could not create user please try again", 500);
    next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: {
      path: req.file.path,
      filename: req.file.filename,
    },
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Sign up failed please try again later", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Sign up failed please try again later", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    //will throw error if something went wrong with the findOne method. We just use try catch here as good practice whilst carrying out async operations.
    const error = new HttpError("Signup failed please try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials could not log you in",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    //load hash password from DB and compare with plain text password input. returns a boolean
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (e) {
    const error = new HttpError(
      "Could not log you in, something went wrong please try again later",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials could not log you in",
      403
    );
    return next(error);
  }

  //create a token.
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Log in failed please try again later", 500);
    return next(error);
  }
  //token is sent to client.
  res.json({ userId: existingUser.id, email: existingUser.email, token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
