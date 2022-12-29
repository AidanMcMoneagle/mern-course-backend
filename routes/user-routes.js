const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

const { getUsers, signup, login } = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

//Retrieve list of users
router.get("/", getUsers);

//create new user and log user in
//fileUpload.single() accepts a single file with the name fieldname and the single file will be stored in req.files
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("password").isLength({ min: 6 }),
    check("email").normalizeEmail().isEmail(),
  ],
  signup
);

//log user in
router.post("/login", login);

module.exports = router;
