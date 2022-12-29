//Checking that user is authenticated i.e. signed in (we know who they are)

const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  // OPTIONS request i sent bry Browser prior to all request bar GET requests (browser behaviour)
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    // encode tokens in headers of incoming request, we have allowed an authorization header to be included in incoming requests from client. Could also encode tokens in query params however would make URL longer.
    const token = req.headers.authorization.split(" ")[1]; //convention is to send TOKENS as follows to indicate request bears token.  AuthorIzation: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed");
    }
    // jwt.verify returns payload decoded if signature is valid. If signature not valid will throw an error.
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed", 403);
    return next(error);
  }
};
