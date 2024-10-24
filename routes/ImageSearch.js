const express = require("express");
const { HfInference } = require("@huggingface/inference");
const Image = require("../models/Image"); // Import Sequelize model]
const process = require("process");
const axios = require("axios");
const { cosineSimilarity } = require('ml-distance');
const {
  ComputerVisionClient,
  AnalyzeImageRequest,
} = require("@azure/cognitiveservices-computervision");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");

const router = express.Router();





// Initialize Hugging Face CLIP model
const hf = new HfInference(process.env.HF_API_KEY);


async function searchImages(queryFeatures) {
  try {
    const images = await Image.findAll({
      raw: true,
    });

    const results = images.map((image) => {
      const imageFeatures = image.features;
      const similarity = cosineSimilarity(queryFeatures, imageFeatures);
      return {
        id: image.id,
        imageUrl: image.imageUrl,
        similarity: similarity,
      };
    });

    // Sort results by similarity in descending order
    results.sort((a, b) => b.similarity - a.similarity);

    return results;
  } catch (error) {
    console.error(error);
    throw error;
  }
}



router.get("/search", async (req, res) => {
  try {
    const query = req.query.query;

    // Search for images based on the query using your desired search algorithm
    // Here's a simple example using full-text search on the `features.description` field:
    const images = await Image.findAll({
      where: {
        "features.description": {
          [Op.like]: `%${query}%`,
        },
      },
    });

    res.json(images);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during image search" });
  }
});


// const cosineSimilarity = (vec1, vec2) => {
//   const normalize = (vec) => {
//       const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
//       return vec.map((val) => val / magnitude);
//   };
//   vec1 = normalize(vec1);
//   vec2 = normalize(vec2);
//   const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
//   const magnitudeA = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
//   const magnitudeB = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

//   if (magnitudeA === 0 || magnitudeB === 0) return 0; // Prevent division by zero

//   return dotProduct / (magnitudeA * magnitudeB);
// };
module.exports = router;
