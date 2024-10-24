const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const { HfInference } = require("@huggingface/inference");
const bodyParser = require("body-parser");
const path = require("path");
const process = require("process");
const Image = require("../models/Image");

const router = express.Router();


const hf = new HfInference(process.env.HF_API_KEY);

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    const clipResponse = await hf.featureExtraction({
      model: "openai/clip-vit-base-patch32",
      inputs: { image: path.resolve(imagePath) },
    });

    const imageEmbedding = clipResponse[0];

    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    const newImage = await Image.create({
      imageUrl,
      embedding: imageEmbedding, 
    });

    res.json({
      message: "Image uploaded and embedding generated successfully!",
      image: newImage,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ error: "An error occurred while uploading the image" });
  }
});

module.exports = router;

