const express = require("express");
const axios = require("axios");
const moment = require("moment");
const { google } = require("google-maps");

const router = express.Router();

router.post('/generate-itinerary', async (req, res) => {
    
});


async function getAttractions(destinationLatLng) {
  // Use Google Places API to get attractions
  const attractionsResponse = await client.places({
    keyword: "attraction",
    location: destinationLatLng,
  });

  return attractionsResponse.results;
}

async function getHotels(destinationLatLng, startDate, endDate) {
  // Use Google Places API to get hotels
  const hotelsResponse = await client.places({
    keyword: "hotel",
    location: destinationLatLng,
  });

  // Filter hotels based on availability and dates
  const availableHotels = hotelsResponse.results.filter((hotel) => {
    // Implement logic to check hotel availability based on dates
    return true; // Placeholder
  });

  return availableHotels;
}

async function getRestaurants(destinationLatLng) {
  // Use Google Places API to get restaurants
  const restaurantsResponse = await client.places({
    keyword: "restaurant",
    location: destinationLatLng,
  });

  return restaurantsResponse.results;
}