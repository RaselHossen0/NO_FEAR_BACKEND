const express = require('express');
const axios = require('axios');
const Trip =require("../models/trip/Trip"); // Assuming models are in ./models
const { Client } = require("@googlemaps/google-maps-services-js");
const TransportOption = require("../models/trip/TransportOption");
const AccommodationOption = require("../models/trip/AccommodationOption");
const MealPlan = require("../models/trip/MealPlan");
const authMiddleware = require('../middleware/authmiddleware'); // Adjust the path as necessary


const router = express.Router();

const googleMapsClient = new Client({});
router.post('/generate', authMiddleware, async (req, res) => {
    const { destination, userLat, userLang, tripDuration, budgetPreference } = req.body;
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
        }
      });
  
      const transportOptions = transportResponse.data.routes[0].legs.map((leg) => ({
        type: "Car",
        timeEstimate: leg.duration.text,
        distance: leg.distance.text,
        cost: Math.floor(leg.distance.value * 0.1) // Calculate based on distance (value in meters)
      }));
  
      // Step 3: Get Accommodation Info (Booking.com API)
    const accommodationResponse = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation', {
      headers: {
        'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
      params: {
        latitude: lat,
        longitude: lng,
        checkIn: '2024-12-20',
        checkOut: '2024-12-25',
        pageNumber: 1,
        currencyCode: 'USD',
      }
    });

const accommodationOptions = accommodationResponse.data.data.data.map((hotel) => ({
    type: budgetPreference,  // Budget, Mid-range, Luxury based on user input
    name: hotel.title || 'Unknown Hotel',  // Hotel name, or fallback if missing
    cost: (hotel.priceForDisplay ? hotel.priceForDisplay.replace('$', '') : '0'),  // Handle missing price data
}));

// Log the processed accommodation options for further debugging
// console.log(accommodationOptions);

  
      // Step 4: Get Meal Info (Yelp API)
      const mealResponse = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          term: 'restaurants',
          latitude: lat,
          longitude: lng,
          price: budgetPreference === 'Budget' ? '1' : budgetPreference === 'Mid-range' ? '2,3' : '4',
        }
      });
      console.log(mealResponse.data.businesses);
  
      const mealPlans = mealResponse.data.businesses.map((restaurant) => ({
        type: 'Meal',
        cost: Math.floor(Math.random() * (budgetPreference === 'Budget' ? 200 : budgetPreference === 'Mid-range' ? 500 : 1000)),
        location: restaurant.name,
      }));
  
      // Step 5: Save Trip and Related Data to Database
      const trip = await Trip.create({
        destination,
        startDate: '2024-12-20',
        endDate: '2024-12-25',
        budgetPreference,
        tripDuration,
        userId,
      });
  
      // Save Transport, Accommodation, and Meal Plans
      await Promise.all(transportOptions.map(option =>
        TransportOption.create({ ...option, tripId: trip.id })
      ));
  
      await Promise.all(accommodationOptions.map(option =>
        AccommodationOption.create({ ...option, tripId: trip.id })
      ));
  
      await Promise.all(mealPlans.map(plan =>
        MealPlan.create({ ...plan, tripId: trip.id })
      ));
  
      // Send back response
      res.status(200).json({
        message: 'Trip generated successfully!',
        trip,
        transportOptions,
        accommodationOptions,
        mealPlans,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error generating trip information' });
    }
  });
  

module.exports = router;