const express = require('express');
const router = express.Router();
const TransportOption = require("../models/trip/TransportOption");
const AccommodationOption = require("../models/trip/AccommodationOption");
const MealPlan = require("../models/trip/MealPlan");
const Trip = require("../models/trip/Trip");
const authMiddleware = require('../middleware/authmiddleware');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const env = require('dotenv');
const fetch = require("node-fetch");

const endpoint = "https://hrase-m2n27lg8-northcentralus.openai.azure.com/openai/deployments/davinci-002/completions?api-version=2022-12-01";
const apiKey = process.env.OPEN_AI_API_KEY;
// POST /generate-blog
router.post('/generate-blog',authMiddleware, async (req, res) => {
  const { tripId } = req.body;
  const userId = req.user;
  console.log("tripId", tripId);
  console.log("userId", userId);

  try {
    // Step 1: Fetch trip details from the database
    const trip = await Trip.findOne({ where: { id: tripId } });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Step 2: Fetch related transport, accommodation, and meal details
    const transportOptions = await TransportOption.findAll({ where: { tripId } });
    const accommodationOptions = await AccommodationOption.findAll({ where: { tripId } });
    const mealPlans = await MealPlan.findAll({ where: { tripId } });

    // Step 3: Generate the blog content based on trip data
    const blogContent = generateBlogContent(trip, transportOptions, accommodationOptions, mealPlans);

    // Step 4: Respond with the generated blog content
    res.status(200).json({
      message: 'Travel blog generated successfully!',
      blogContent,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating blog content' });
  }
});

// Function to generate the blog content



async function generateBlogContent(trip, transportOptions, accommodationOptions, mealPlans) {
    const startDate = new Date(trip.startDate).toLocaleDateString();
    const endDate = new Date(trip.endDate).toLocaleDateString();

    let prompt = `Generate a detailed and engaging travel blog for a trip with the following details:\n\n`;
    prompt += `Destination: ${trip.destination}\n`;
    prompt += `Trip Duration: ${startDate} - ${endDate}\n`;
    prompt += `Budget Preference: ${trip.budgetPreference}\n\n`;

    if (transportOptions.length > 0) {
        prompt += `Transport Options:\n`;
        transportOptions.forEach(option => {
            prompt += `- Type: ${option.type}, Time Estimate: ${option.timeEstimate}, Distance: ${option.distance}, Cost: $${option.cost}\n`;
        });
    }

    if (accommodationOptions.length > 0) {
        prompt += `\nAccommodation:\n`;
        accommodationOptions.forEach(option => {
            prompt += `- Name: ${option.name}, Cost: $${option.cost}\n`;
        });
    }

    if (mealPlans.length > 0) {
        prompt += `\nMeal Plans:\n`;
        mealPlans.forEach(plan => {
            prompt += `- Location: ${plan.location}, Estimated Cost: $${plan.cost}\n`;
        });
    }

    prompt += `\nRecap: This trip to ${trip.destination} was an unforgettable experience. You stayed at some great hotels, enjoyed delicious meals, and traveled efficiently with your chosen transport options.\n`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
        },
        body: JSON.stringify({
            prompt: prompt,
            max_tokens: 500,
            temperature: 0.7,
            
        }),
    });

    const data = await response.json();
    console.log(data);
    return data.choices[0].text.trim();
}

module.exports = router;

