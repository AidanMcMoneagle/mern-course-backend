//create new js class (blueprint for gs project)
class HttpError extends Error {
  constructor(message, statuscode) {
    super();
    this.message = message;
    this.statuscode = statuscode;
  }
}

module.exports = HttpError;
