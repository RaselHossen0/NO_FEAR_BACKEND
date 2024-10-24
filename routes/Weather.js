// Import dependencies
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const admin = require('firebase-admin'); // Firebase Admin for push notifications
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

// Load environment variables
const OPEN_WEATHER_API_KEY = process.env.OPEN_WEATHER_API_KEY;
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

// Initialize Firebase Admin SDK for push notifications
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FCM_TYPE,
    project_id: process.env.FCM_PROJECT_ID,
    private_key_id: process.env.FCM_PRIVATE_KEY_ID,
    private_key: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FCM_CLIENT_EMAIL,
    client_id: process.env.FCM_CLIENT_ID,
    auth_uri: process.env.FCM_AUTH_URI,
    token_uri: process.env.FCM_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FCM_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FCM_CLIENT_X509_CERT_URL
  })
});

// Function to fetch weather data
async function getWeatherData(city) {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        appid: OPEN_WEATHER_API_KEY,
        units: 'metric' // Celsius
      }
    });

    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    throw error;
  }
}

// Function to send push notifications to users
async function sendWeatherNotification(fcmToken, messageTitle, messageBody) {
  const message = {
    notification: {
      title: messageTitle,
      body: messageBody
    },
    token: fcmToken // FCM device token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
  } catch (error) {
    console.error("Error sending notification:", error.message);
  }
}

// Function to check weather and send notifications based on alerts
async function checkWeatherAndNotify(city, fcmToken) {
  try {
    const weatherData = await getWeatherData(city);

    // Example: Send notification if rain is expected
    const weatherDescription = weatherData.weather[0].description;
    const temp = weatherData.main.temp;

    if (weatherDescription.includes("rain")) {
      const messageTitle = `Weather Alert for ${city}`;
      const messageBody = `It looks like it's going to rain today in ${city}. Current temperature is ${temp}°C.`;

      // Send notification
      await sendWeatherNotification(fcmToken, messageTitle, messageBody);
    } else if (temp > 35) {
      const messageTitle = `Heat Alert for ${city}`;
      const messageBody = `High temperatures detected in ${city}. Stay hydrated! Current temperature is ${temp}°C.`;

      // Send notification
      await sendWeatherNotification(fcmToken, messageTitle, messageBody);
    }

    console.log(`Weather check completed for ${city}: ${weatherDescription}, ${temp}°C`);
  } catch (error) {
    console.error("Error checking weather and sending notification:", error.message);
  }
}

// Schedule weather checks every day at 8 AM for users
cron.schedule('0 8 * * *', async () => {
  // Assume we get the user's trip city and FCM token from a database
  const city = "Dhaka"; // Example city
  const fcmToken = "USER_FCM_TOKEN"; // Example user's FCM token

  console.log("Running scheduled weather check...");
  await checkWeatherAndNotify(city, fcmToken);
});

// Example route to trigger weather notification on demand
app.post('/weather-notify', async (req, res) => {
  const { city, fcmToken } = req.body;

  try {
    await checkWeatherAndNotify(city, fcmToken);
    res.status(200).json({ message: 'Weather notification sent successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send weather notification' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
