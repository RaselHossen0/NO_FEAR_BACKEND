const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const { HfInference } = require("@huggingface/inference");
const bodyParser = require("body-parser");
const path = require("path");
const process = require("process");
const fs = require("fs");
const axios = require("axios");
const {
  ComputerVisionClient,
  AnalyzeImageRequest,
} = require("@azure/cognitiveservices-computervision");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");
const Image = require("../models/Image");

const router = express.Router();

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ apiKey: process.env.AZURE_API_KEY, inHeader: true }),
  process.env.AZURE_ENDPOINT
);

// const hf = new HfInference(process.env.HF_API_KEY);

const upload = multer({ dest: "uploads/" });



router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`; // Replace with your actual server URL

    // Analyze the image using Azure Computer Vision API
    // const analyzeImageRequest = new AnalyzeImageRequest({
    //   visualFeatures: ["Description", "Tags", "Color"], // Customize features as needed
    // });

    const result = await computerVisionClient.analyzeImage(
      imageUrl,
    //   analyzeImageRequest
    );

    const features = {
      description: result.description.captions[0].text,
      tags: result.tags,
      color: result.color.dominantColor,
    }; // Extract more features based on your needs

    // Create a new image record in the database
    const newImage = await Image.create({
      imageUrl,
      features,
    });

    res
      .status(201)
      .json({ message: "Image uploaded successfully", image: newImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred during image upload",
    });
  }
});

module.exports = router;

