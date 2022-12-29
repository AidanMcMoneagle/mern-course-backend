const express = require("express");
const router = express.Router();
const { check } = require("express-validator"); //express validator package used to validate incoming requests (e.go check whether req.bpdy contains certain fields)
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controllers/places-controllers");

//return place with given Id.
router.get("/:pId", getPlaceById);

//return all places for a given user Id
router.get("/user/:uid", getPlacesByUserId);

//middleware which checks a request for a valid token. Enables us to protect bottom 3 routes. We only want users to be able to create a place /update a place/ delete a place if they are authenticated (we know who they are)

router.use(checkAuth);

// create a new place
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  createPlace
);

// update place by place Id.
router.patch(
  "/:pId",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  updatePlace
);

router.delete("/:pId", deletePlace);

module.exports = router;
