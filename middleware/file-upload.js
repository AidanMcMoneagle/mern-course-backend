const multer = require("multer");
const { storage } = require("../cloudinary/cloudinary");
// set storage destination to the storage object.
const upload = multer({ storage: storage });

module.exports = upload;
