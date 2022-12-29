const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs"); //fs module allows us to interact with files on the server

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../utils/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pId;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    // error is only thrown when connecting to database (server error). Error is not thrown if place is empty.
    const error = new HttpError(
      "Something went wrong could not find a place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find place for the provided id",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) }); //=> by setting getters: true we create an id property. The value is equal to _id property. Cleaner to use. by using toObject() we convert mongoose object to normal js object.
};

// finding places by user Id.
const getPlacesByUserId = async (req, res, next) => {
  const userID = req.params.uid;

  let foundUserPlaces;
  try {
    foundUserPlaces = await Place.find({ creator: userID });
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500
    );
    return next(error);
  }

  if (foundUserPlaces.length === 0) {
    return next(
      new HttpError("Could not find a place for the provided user id", 404)
    ); //return next(err) which will reach the next error handling middleware.
  }

  res.json({
    foundUserPlaces: foundUserPlaces.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req); //finds any validation errors in the request object. Returns errors object. Errors object has methods which can call
  console.log(errors);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates; // define outside of try block so coordinates is not block scoped.
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const imagePath = req.file.path.replace(/\\/g, "/");

  const createdPlace = new Place({
    title,
    description,
    image: imagePath,
    address,
    location: coordinates,
    creator: req.userData.userId,
  });

  //find user based on userId. Check to see if user exists.
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("creating place failed please try again");
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  // need to add place id to corresponding user.
  // want to execute multiple operations which are not directly related to eachother. If one of the operation fails independently of another we want to undo all operations.
  // to do this we need to use transactions and sessions.

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace); // not standard push. method used by mongoose which behind the scenes grabs the place id and adds to user
    await user.save({ session: sess });
    await sess.commitTransaction(); // only at this point the changes are saved to the database.
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

// need to ensure that only the user that created the place can update the place.

// if(req.userData.userId !== Place.creator) want to return error.

// need to find place
// need to ensure that the logged in user is equal to the creator the place.
// need to overrrite properties
//need to then save place to db
//send updateplace back to frontEnd
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, could not update Place", 422);
  }

  const { pId } = req.params;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(pId);
  } catch (err) {
    const error = new HttpError(
      "Could not update place, please try again later",
      500
    );
    next(error);
  }

  // must call .toString() as the type of place.creator is a mongoose ObjectId
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Could not update place, please try again later",
      500
    );
    return next(error);
  }

  // let updatedPlace;
  // try {
  //   updatedPlace = await Place.findByIdAndUpdate(pId, { ...req.body });
  // } catch (e) {
  //   const error = new HttpError(
  //     "Could not update place, please try again later",
  //     500
  //   );
  //   return next(error);
  // }

  // placeToBeUpdated.title = title;
  // placeToBeUpdated.description = description;

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// need to esnure that

const deletePlace = async (req, res, next) => {
  const { pId } = req.params;

  let place;
  try {
    place = await Place.findById(pId).populate("creator"); //if we want access to properties of the user that is stored in reference in the place document we use the populate method. Get access to entire document stored in another collection with the populate method.
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find a place for this Id");
    return next(error);
  }

  if (req.userData.userId !== place.creator.id) {
    const error = new HttpError(
      "You are not allowed to delete this place",
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction(); // only at this point the changes are saved to the database.
  } catch (e) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  // deletes image file from server once we delete a place.
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "DELETED PLACE" });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
