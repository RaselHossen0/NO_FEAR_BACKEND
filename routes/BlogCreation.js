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
const Blog = require("../models/Blog");

const endpoint = "https://hrase-m2n3eo6g-northcentralus.openai.azure.com/openai/deployments/gpt-35-turbo-16k/chat/completions?api-version=2024-08-01-preview";
const apiKey = process.env.OPEN_AI_API_KEY;
// POST /generate-blog
router.post('/generate-blog',authMiddleware, async (req, res) => {
  const { tripId ,notableEvents,title} = req.body;
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
    const blogContent =await generateBlogContent(trip, transportOptions, accommodationOptions, mealPlans);


const blog = await Blog.create({
    TripId: tripId,
    UserId: userId,
    title: title,
    description: blogContent,
    notableEvents: notableEvents,
});


    // Step 4: Respond with the generated blog content
    res.status(200).json({
      message: 'Travel blog generated successfully!',
      blog
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

    prompt += `\nRecap: This trip to ${trip.destination} was an unforgettable experience. You stayed at some great hotels, enjoyed delicious meals, and traveled efficiently with your chosen transport options.Dont give any title and use proper tense in the sentences\n`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
        },
        body: JSON.stringify({
            messages: [  
                          { role: "user", content: prompt }  
                         ],  
                
                         max_tokens: 800,  
                     temperature: 0.7,  
                     top_p: 0.95,  
                         frequency_penalty: 0,  
                       presence_penalty: 0,  
                        stop: null  
            
        }),
    });

    const data = await response.json();
    // console.log(data.choices);
    // for (let i = 0; i < data.choices.length; i++) {
    //     console.log(data.choices[i].message.content);
    // }

    if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from the API');
    }

    return data.choices[0].message.content.trim();
}
// PUT /edit-blog/:blogId
router.put('/edit-blog/:blogId', authMiddleware, async (req, res) => {
    const { title, description, notableEvents } = req.body;
    const blogId = req.params.blogId;
    const userId = req.user; // Assuming user info is provided from middleware
    console.log("userId", userId);
    console.log("blogId", blogId);
  
    try {
      // Step 1: Find the blog to update
      const blog = await Blog.findOne({ where: { id: blogId, UserId: userId } });
  
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found or not authorized to edit' });
      }
  
      // Step 2: Update blog fields
      blog.title = title || blog.title;
      blog.description = description || blog.description;
      blog.notableEvents = notableEvents || blog.notableEvents;
  
      // Step 3: Save the updated blog
      await blog.save();
  
      res.status(200).json({
        message: 'Blog updated successfully!',
        blog
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error updating blog' });
    }
  });
// DELETE /delete-blog/:blogId
router.delete('/delete-blog/:blogId', authMiddleware, async (req, res) => {
    const blogId = req.params.blogId;
    const userId = req.user; // Assuming user info is provided from middleware
  
    try {
      // Step 1: Find the blog to delete
      const blog = await Blog.findOne({ where: { id: blogId, UserId: userId } });
  
      if (!blog) {
        return res.status(404).json({ error: 'Blog not found or not authorized to delete' });
      }
  
      // Step 2: Delete the blog
      await blog.destroy();
  
      res.status(200).json({
        message: 'Blog deleted successfully!'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error deleting blog' });
    }
  });
    

//give blog edit and delete options
//get all blo

module.exports = router;

