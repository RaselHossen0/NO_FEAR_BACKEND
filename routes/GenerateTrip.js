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
    const  userId  = req.user;
  
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
      const today = new Date();
      const checkIn = today.toISOString().split('T')[0]; // Format to YYYY-MM-DD
      
      const checkOutDate = new Date();
      checkOutDate.setDate(today.getDate() + 5); // Add 5 days for check-out
      const checkOut = checkOutDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
      
      
      // Step 3: Get Accommodation Info (Booking.com API)
    const accommodationResponse = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation', {
      headers: {
        'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
      params: {
        latitude: lat,
        longitude: lng,
        checkIn: checkIn,
        checkOut: checkOut,
        pageNumber: 1,
        currencyCode: 'USD',
      }
    });

const accommodationOptions = accommodationResponse.data.data.data.map((hotel) => {
    console.log(hotel); // Print hotel information
    return {
        type: budgetPreference,  // Budget, Mid-range, Luxury based on user input
        name: hotel.title + ','+hotel.secondaryInfo || 'Unknown Hotel',  // Hotel name, or fallback if missing
        cost: (hotel.priceForDisplay ? hotel.priceForDisplay.replace('$', '') : '0'),  // Handle missing price data,
        photos : hotel.cardphotos._sizes?.ma
    };
});


  
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
        location: restaurant.name + ', ' + restaurant.secondaryInfo??'',
      }));
  
      // Step 5: Save Trip and Related Data to Database
      const trip = await Trip.create({
        destination,
        startDate: new Date(), // Convert to Date object
        endDate: new Date(Date.now() + (tripDuration * 24 * 60 * 60 * 1000)), // Convert to Date object
        budgetPreference,
        tripDuration,
        userId: userId,
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
  
  router.post('/generate/public', async (req, res) => {
    const { destination, userLat, userLang, tripDuration, budgetPreference } = req.body;

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
        const today = new Date();
        const checkIn = today.toISOString().split('T')[0]; // Format to YYYY-MM-DD

        const checkOutDate = new Date();
        checkOutDate.setDate(today.getDate() + 5); // Add 5 days for check-out
        const checkOut = checkOutDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD

        // Step 3: Get Accommodation Info (Booking.com API)
        const accommodationResponse = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation', {
            headers: {
                'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            },
            params: {
                latitude: lat,
                longitude: lng,
                checkIn: checkIn,
                checkOut: checkOut,
                pageNumber: 1,
                currencyCode: 'USD',
            }
        });

        const accommodationOptions = accommodationResponse.data.data.data.map((hotel) => {
            return {
                type: budgetPreference,  // Budget, Mid-range, Luxury based on user input
                name: hotel.title + ',' + hotel.secondaryInfo || 'Unknown Hotel',  // Hotel name, or fallback if missing
                cost: (hotel.priceForDisplay ? hotel.priceForDisplay.replace('$', '') : '0'),  // Handle missing price data,
                photos: hotel.cardPhotos?.map((photo) => {
                    const url = photo.sizes?.urlTemplate.replace('{width}', photo.sizes.maxWidth).replace('{height}', photo.sizes.maxHeight);
                    return url;
                }) || [],  // Get hotel photos
            };
        });

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

        const mealPlans = mealResponse.data.businesses.map((restaurant) => ({
            type: 'Meal',
            cost: Math.floor(Math.random() * (budgetPreference === 'Budget' ? 200 : budgetPreference === 'Mid-range' ? 500 : 1000)),
            location: restaurant.name + ', ' + restaurant.secondaryInfo ?? '',
        }));

        // Send back response
        res.status(200).json({
            message: 'Trip generated successfully!',
            transportOptions,
            accommodationOptions,
            mealPlans,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating trip information' });
    }
});

router.get('/trips/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const trips = await Trip.findAll({
            where: { userId },
            include: [
            { model: TransportOption, as: 'transportOptions' },
            { model: AccommodationOption, as: 'accommodationOptions' },
            { model: MealPlan, as: 'mealPlans' }
            ]
        });

        res.status(200).json(trips);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching trips' });
    }
});

//delete trip
router.delete('/delete/:tripId', async (req, res) => {
    const { tripId } = req.params;

    try {
        await Trip.destroy({
            where: { id: tripId }
        });

        res.status(200).json({ message: 'Trip deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting trip' });
    }
});

module.exports = router;