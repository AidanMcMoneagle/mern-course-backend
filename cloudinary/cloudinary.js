const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// look on cloudinary docks, node.js SDK.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "MERN COURSE APP",
    allowedFormats: ["jpeg", "png", "jpg"],
    secure: true,
  },
});

module.exports = { storage, cloudinary };
