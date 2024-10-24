const express = require("express");
const axios = require("axios");
const Trip = require("../models/trip/Trip"); // Assuming models are in ./models
const { Client } = require("@googlemaps/google-maps-services-js");
const TransportOption = require("../models/trip/TransportOption");
const AccommodationOption = require("../models/trip/AccommodationOption");
const MealPlan = require("../models/trip/MealPlan");
const authMiddleware = require("../middleware/authmiddleware"); // Adjust the path as necessary

const router = express.Router();
const googleMapsClient = new Client({});

router.post("/generate", authMiddleware, async (req, res) => {
  const { destination, userLat, userLang, tripDuration, budgetPreference } =
    req.body;
  const { userId } = req.user;

  try {
    // Step 1: Geocode the destination
    const geocodeResponse = await googleMapsClient.geocode({
      params: {
        address: destination,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    const location = geocodeResponse.data.results[0].geometry.location;
    const { lat, lng } = location;

    // Step 2: Generate Transport Info
    const transportResponse = await googleMapsClient.directions({
      params: {
        origin: `${userLat},${userLang}`,
        destination,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const transportOptions = transportResponse.data.routes[0].legs.map(
      (leg) => ({
        type: "Car",
        timeEstimate: leg.duration.text,
        distance: leg.distance.text,
        cost: Math.floor(leg.distance.value * 0.1), // Calculate based on distance (value in meters)
      })
    );

    // Step 3: Get Accommodation Info using Google Places API
    const accommodationResponse = await googleMapsClient.placesNearby({
      params: {
        location: { lat, lng },
        radius: 5000, // Search within 5km
        type: "lodging", // Hotel or lodging types
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const accommodationOptions = accommodationResponse.data.results.map(
      (place) => ({
        type: budgetPreference,
        name: place.name || "Unknown Hotel",
        cost: Math.floor(
          Math.random() *
            (budgetPreference === "Budget"
              ? 50
              : budgetPreference === "Mid-range"
              ? 150
              : 300)
        ),
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      })
    );

    // Step 4: Get Meal Info using Google Places API (instead of Yelp)
    const mealResponse = await googleMapsClient.placesNearby({
      params: {
        location: { lat, lng },
        radius: 3000, // Search within 3km
        type: "restaurant", // Type set to restaurant
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const mealPlans = mealResponse.data.results.map((restaurant) => ({
      type: "Meal",
      cost: Math.floor(
        Math.random() *
          (budgetPreference === "Budget"
            ? 200
            : budgetPreference === "Mid-range"
            ? 500
            : 1000)
      ),
      location: restaurant.name,
      latitude: restaurant.geometry.location.lat,
      longitude: restaurant.geometry.location.lng,
    }));

    // Step 5: Save Trip and Related Data to Database
    const trip = await Trip.create({
      destination,
      startDate: "2024-12-20",
      endDate: "2024-12-25",
      budgetPreference,
      tripDuration,
      userId,
    });

    // Save Transport, Accommodation, and Meal Plans
    await Promise.all(
      transportOptions.map((option) =>
        TransportOption.create({ ...option, tripId: trip.id })
      )
    );

    await Promise.all(
      accommodationOptions.map((option) =>
        AccommodationOption.create({ ...option, tripId: trip.id })
      )
    );

    await Promise.all(
      mealPlans.map((plan) => MealPlan.create({ ...plan, tripId: trip.id }))
    );

    // Send back response
    res.status(200).json({
      message: "Trip generated successfully!",
      trip,
      transportOptions,
      accommodationOptions,
      mealPlans,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating trip information" });
  }
});

module.exports = router;
