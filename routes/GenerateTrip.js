const express = require("express");
const axios = require("axios");
const Trip = require("../models/trip/Trip"); // Assuming models are in ./models
const { Client } = require("@googlemaps/google-maps-services-js");
const TransportOption = require("../models/itirenary/TransportOption");
const AccommodationOption = require("../models/itirenary/AccomodationOption");
const MealPlan = require("../models/itirenary/MealPlan");
const authMiddleware = require("../middleware/authmiddleware"); // Adjust the path as necessary

const router = express.Router();
const Iternery = require("../models/iternery/Iternery");
const { mod } = require("mathjs");
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
const endpoint = "https://hrase-m2n3eo6g-northcentralus.openai.azure.com/openai/deployments/gpt-35-turbo-16k/chat/completions?api-version=2024-08-01-preview";
const apiKey = process.env.OPEN_AI_API_KEY;
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
    cost: (hotel.priceForDisplay ? hotel.priceForDisplay.replace('$', '') * 117 : 'Price not available'),  // Handle missing price data
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
  
  router.post("/create", authMiddleware, async (req, res) => {
    const { destination, tripDuration, budgetPreference ,startDate} = req.body;
    const  userId  = req.user;
    // console.log("userId", userId);
  
    try {
      // Create a new trip
      const trip = await Trip.create({
        destination,
        startDate: Date.parse(startDate), // Set startDate dynamically or allow user input
        endDate: new Date(new Date().setDate(new Date().getDate() + tripDuration)), // Calculate endDate
        budgetPreference,
        tripDuration,
        userId: userId,
      });
  
      res.status(200).json({
        message: "Trip created successfully!",
        trip,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error creating trip" });
    }
  });
  router.post("/:tripId/itinerary/generate", authMiddleware, async (req, res) => {
    const { tripId } = req.params;
    const { userLat, userLng, preferences } = req.body;
  
    try {
      // Fetch the trip from the database
      const trip = await Trip.findByPk(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
  
      const destination = trip.destination;
  
      // Step 1: Geocode the destination
      const geocodeResponse = await googleMapsClient.geocode({
        params: { address: destination, key: process.env.GOOGLE_MAPS_API_KEY },
      });
      const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
  
      // Step 2: Get transport options using Google Maps Directions API
      const transportResponse = await googleMapsClient.directions({
        params: {
          origin: `${userLat},${userLng}`,
          destination,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
  
      let transportOptions = [];
      if (transportResponse.data && transportResponse.data.routes.length > 0) {
        transportOptions = transportResponse.data.routes[0].legs.map((leg) => ({
          type: "Car",
          timeEstimate: leg.duration.text,
          distance: leg.distance.text,
          cost: Math.floor(leg.distance.value * 0.1),
        }));
      }
  
      // Step 3: Get accommodation options using Google Places API
      const accommodationResponse = await googleMapsClient.placesNearby({
        params: {
          location: { lat, lng },
          radius: 5000,
          type: "lodging",
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
  
      let accommodationOptions = accommodationResponse.data.results.map((place) => ({
        type: preferences.budgetPreference,
        name: place.name || "Unknown Hotel",
        cost: Math.floor(Math.random() * 
          (preferences.budgetPreference === "Budget" ? 50 :
          preferences.budgetPreference === "Mid-range" ? 150 : 300)),
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      }));
  
      // Step 4: Get meal plan options using Google Places API
      const mealResponse = await googleMapsClient.placesNearby({
        params: {
          location: { lat, lng },
          radius: 3000,
          type: "restaurant",
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
  
      let mealPlans = mealResponse.data.results.map((restaurant) => ({
        type: "Meal",
        cost: Math.floor(Math.random() * 
          (preferences.budgetPreference === "Budget" ? 200 :
          preferences.budgetPreference === "Mid-range" ? 500 : 1000)),
        location: restaurant.name,
        latitude: restaurant.geometry.location.lat,
        longitude: restaurant.geometry.location.lng,
      }));
      const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + process.env.GEMINI_API_KEY;
      console.log("Gemini Endpoint:", geminiEndpoint);

      // Step 5: Use Gemini API to filter the best options based on preferences
      const geminiResponse = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
        {
          parts: [
            {
          text: `Plan a ${trip.tripDuration}-day trip to ${destination}. The user prefers ${preferences.transport} transportation, ${preferences.budgetPreference} accommodation, and enjoys ${preferences.activities}. Here are the available options:
          Transport: ${transportOptions.map(option => `${option.type} (${option.timeEstimate}, ${option.distance}, $${option.cost})`).join(", ")}
          Accommodation: ${accommodationOptions.map(option => `${option.name} ($${option.cost})`).join(", ")}
          Meal: ${mealPlans.map(plan => `${plan.location} ($${plan.cost})`).join(", ")}
          Provide top 3 transport, accommodation, and meal options each day in this format (Please dont give anything like your comment ect. just in the required format,with comma seperated lines): 
          Day 1:
          Transport: {option1, option2, option3}
          Accommodation: {option1, option2, option3}
          Meal: {option1, option2, option3}`,
        
            },
          ],
        },
          ],
        }),
      });
      
      // Parse the response from the Gemini API
      const geminiData = await geminiResponse.json();
      console.log("Gemini Response:", geminiData);
      
      // Extract the generated itinerary content from the response
      const generatedItinerary = geminiData.candidates?.[0]?.content.parts[0].text || "No itinerary generated.";
      console.log("Generated Itinerary:", generatedItinerary);
      
      // Step 6: Extract and Save itinerary and options to the database
     
      const itineraryDays = generatedItinerary.split("\n\n");

      for (let i = 0; i < itineraryDays.length; i++) {
        const dayNumber = i + 1;
      
        // Split the day's details by lines and filter out any empty lines
        const dayDetails = itineraryDays[i].split("\n").filter(Boolean);
      
        // Extract transport options
        const transportLine = dayDetails.find(line => line.startsWith("* **Transport:**"));
        const transportOptions = transportLine ? transportLine.split("**Transport:**")[1].split(",").map(option => option.trim()) : [];
      
        // Extract accommodation options
        const accommodationLine = dayDetails.find(line => line.startsWith("* **Accommodation:**"));
        const accommodationOptions = accommodationLine ? accommodationLine.split("**Accommodation:**")[1].split(",").map(option => option.trim()) : [];
      
        // Extract meal options
        const mealLine = dayDetails.find(line => line.startsWith("* **Meal:**"));
        const mealOptions = mealLine ? mealLine.split("**Meal:**")[1].split(",").map(option => option.trim()) : [];
      
        // Save itinerary per day
        await Iternery.create({
          dayNumber,
          activity: `Day ${dayNumber} Itinerary : ${dayDetails}`, // Optional placeholder for activities
          tripId: trip.id,
        });try {
          const allItinerary = await Iternery.findAll({ where: { tripId: trip.id } });
        
          // Create a new array to hold the itinerary and related details
          const itineraryWithDetails = [];
        
          for (let itinerary of allItinerary) {
            const dayNumber = itinerary.dayNumber;
        
            // Find accommodation options for this day
            const accommodations = await AccommodationOption.findAll({
              where: {
                itineraryId: itinerary.id
              },
            });
        
            // Find transport options for this day
            const transportOptions = await TransportOption.findAll({
              where: {
                itineraryId: itinerary.id,
          
              },
            });
        
            // Find meal options for this day
            const mealPlans = await MealPlan.findAll({
              where: {
                itineraryId: itinerary.id,
               
              },
            });
        
            // Push the itinerary and associated details to the new array
            itineraryWithDetails.push({
              dayNumber: dayNumber,
              itinerary: itinerary,  // Store the itinerary details
              accommodations: accommodations,  // Store the accommodations
              transportOptions: transportOptions,  // Store the transport options
              mealPlans: mealPlans,  // Store the meal plans
            });
          }
        
          // Return the full itinerary with accommodations, transport, and meal options
          res.status(200).json({
            message: "Itinerary and details retrieved successfully!",
            data: itineraryWithDetails, // Respond with the new array
          });
        
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Error retrieving itinerary and details" });
        }
      }
    } catch (error) {
      console.error(error);
      //if any erro
      res.status(500).json({ error: "Error generating itinerary" });
    }
  });

  module.exports = router;