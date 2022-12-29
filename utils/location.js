const process = require("process");
const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

const getCoordsForAddress = async function (address) {
  const encodedAddress = encodeURIComponent(address);
  console.log(encodedAddress);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`
  );

  const data = await response.json();

  console.log(data);

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the specified address",
      422
    );
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
};

module.exports = getCoordsForAddress;
