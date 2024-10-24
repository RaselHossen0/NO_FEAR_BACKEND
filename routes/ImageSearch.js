const express = require("express");
const { HfInference } = require("@huggingface/inference");
const Image = require("../models/Image"); // Import Sequelize model]
const process = require("process");

const router = express.Router();

// Initialize Hugging Face CLIP model
const hf = new HfInference(process.env.HF_API_KEY);

// Cosine similarity function
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  let magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  let magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

router.post("/search", async (req, res) => {
  const { query } = req.body;

  try {
    const clipResponse = await hf.featureExtraction({
      model: "openai/clip-vit-base-patch32",
      inputs: query,
    });

    const textEmbedding = clipResponse[0]; 

    const images = await Image.findAll();

    const similarities = images.map((image) => {
      const imageEmbedding = image.embedding;
      const similarity = cosineSimilarity(textEmbedding, imageEmbedding);
      return { imageUrl: image.imageUrl, similarity };
    });

    similarities.sort((a, b) => b.similarity - a.similarity);

    res.json(similarities.slice(0, 5));
  } catch (error) {
    console.error("Error during search:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching for images" });
  }
});

module.exports = router;
