const mongoose = require("mongoose");
const { Schema } = mongoose;
const uniquevalidator = require("mongoose-unique-validator");

// uniquevalidator package

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // unique property creates an index for the email, speeds up the query processs,
  password: { type: String, required: true, minlength: 6 },
  image: {
    path: { type: String, required: true },
    filename: { type: String, required: true },
  },
  places: [{ type: Schema.Types.ObjectId, required: true, ref: "Place" }], // each user will have a number of places. each place will be stored as an ObjectId.
});

//applies the uniquevalidator plugin to the schema. Uniquevalidator will check for duplicate database entries and report them just like any other validation error.
userSchema.plugin(uniquevalidator);

const User = mongoose.model("User", userSchema);

module.exports = User;
