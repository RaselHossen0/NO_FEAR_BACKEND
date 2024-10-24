Album.js

const Album = require('../models/Album');
const Image = require('../models/Image');
const multer = require('multer');
const express = require("express");


const { ImageAnnotatorClient } = require("@google-cloud/vision");
const { HfInference } = require("@huggingface/inference"); // Hugging Face API for embeddings
const tf = require("@tensorflow/tfjs"); // Required for TensorFlow.js
// Create a new album
exports.createAlbum = async (req, res) => {
  try {
    const album = await Album.create(req.body);
    res.status(201).json(album);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all albums
exports.getAllAlbums = async (req, res) => {
  try {
    const albums = await Album.findAll();
    const result = await Promise.all(albums.map(async (album) => {
      const images = await Image.findAll({ where: { AlbumId: album.id } });
      return { ...album.toJSON(), images }; // Convert album to JSON and add images field
    }));
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all albums by trip ID
exports.getAlbumsByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;
    const albums = await Album.findAll({ where: { TripId: tripId }, include: [Image] });
    res.status(200).json(albums);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single album by ID
exports.getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;
    const album = await Album.findByPk(id, { include: [Image] });
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    //return album with images
    const images = await Image.findAll({ where: { AlbumId: id } });
    album.dataValues.images = images;
    res.status(200).json(album);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update an album by ID
exports.updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Album.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ error: 'Album not found' });
    }
    const updatedAlbum = await Album.findByPk(id);
    res.status(200).json(updatedAlbum);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete an album by ID
exports.deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Album.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.status(204).json();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Upload image to album
exports.uploadImageToAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await Album.findByPk(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Set up multer for file upload
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    });

    const upload = multer({ storage }).single('image');

    // Upload image
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const imagePath = req.file.path;
      console.log("Image path:", imagePath);

      // Use the Vision API client for label detection
      const labels = await detectLabels(imagePath);

      // Generate embeddings for the labels
      const embeddings = await generateEmbeddings(labels);
      console.log("Embeddings:", embeddings);

      // Save image metadata and labels in MySQL database
      const image = await Image.create({
        imageUrl: `/uploads/${req.file.filename}`,
        tags: JSON.stringify(embeddings),
        ...req.body,
        title: req.file.filename
      });

      await album.addImage(image);

      res.status(201).json({ message: "Image uploaded and metadata stored", labels });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// const esClient = new Client({
//   node: process.env.ELASTIC_API_ENDPOINT,
//   auth: {
//     apiKey: process.env.ELASTIC_API_KEY,
//   },
// });

const hf = new HfInference(process.env.HF_API_KEY);

const upload = multer({ dest: "uploads/" });


// Function to generate embeddings using Hugging Face's Inference API
async function generateEmbeddings(texts) {
  const response = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2", // You can change this to any other Hugging Face model
    inputs: typeof(texts)==Array? texts.join(', '): texts,
  });
  

  return response;
}


// Function to detect labels using Google Vision API
async function detectLabels(imagePath) {
  const client = new ImageAnnotatorClient({
    keyFilename: "gsheetapp-438518-395713e5bbb9.json",
  });

  const [result] = await client.labelDetection(imagePath);
  return result.labelAnnotations.map((label) => label.description);
}

// Add this before your search to verify the index configuration
const linearTransformVector = (vector) => {
  try {
    let parsedVector = typeof vector === "string" ? JSON.parse(vector) : vector;

    if (!Array.isArray(parsedVector)) {
      throw new Error("Input must be an array");
    }

    const sourceLength = parsedVector.length;
    const targetLength = 3840; // Target dimension for image embeddings

    if (sourceLength === targetLength) {
      return parsedVector;
    }

    const result = new Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
      const position = (i * (sourceLength - 1)) / (targetLength - 1);
      const indexBefore = Math.floor(position);
      const indexAfter = Math.min(indexBefore + 1, sourceLength - 1);
      const weight = position - indexBefore;
      result[i] =
        (1 - weight) * parsedVector[indexBefore] +
        weight * parsedVector[indexAfter];
    }

    return result;
  } catch (error) {
    console.error("Vector transformation error:", error);
    throw error;
  }
};

// Normalize vector
const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => val / magnitude);
};


// Function to calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
   let dotProduct = 0;
   let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Function to parse comma-separated string into an array of numbers
const parseEmbedding = (embeddingStr) => {
  embeddingStr = embeddingStr.replace(/[\[\]]/g, ''); // Remove square brackets
  return embeddingStr.split(',').map(Number);
};

// Search endpoint
exports.queryImage = async (req, res) => {
  try {
    const { query ,albumId} = req.query; // Get search query from URL parameters
    console.log("query",query);
    console.log("albumId",albumId);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // 1. Convert query to embedding
    const queryEmbedding = await generateEmbeddings(query);
    console.log("Original embedding dimension:", queryEmbedding.length);

    // 2. Transform to match image embedding dimension
    let transformedVector = normalizeVector(linearTransformVector(queryEmbedding));
    console.log("Transformed embedding dimension:", transformedVector.length);


    const album = await Album.findByPk(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const images = await Image.findAll({ where: { AlbumId: albumId } });

    // 3. Retrieve image embeddings from MySQL using Sequelize
    // const images = await Image.findAll();

    // 4. Calculate cosine similarity for each image embedding
    const results = images
      .map((image) => {
        const tags = image.tags || {};
        const imageEmbedding = parseEmbedding(tags);

        // Check if the dimensions match
        if (imageEmbedding.length !== transformedVector.length) {
          console.warn(`Dimension mismatch: image ID ${image.id}`);
          return null; // Skip if the dimensions do not match
        }

        const similarity = cosineSimilarity(transformedVector, imageEmbedding);
        return {
          id: image.id,
          similarity,
          imageUrl: image.imageUrl,
        };
      })
      .filter((result) => result !== null); // Filter out any null results

    // 5. Sort results by similarity in descending order
    results.sort((a, b) => b.similarity - a.similarity);

    // 6. Return the top results
    return res.status(200).json({
      success: true,
      query: query,
      results: results.slice(0, 10), // Return top 10 results
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error performing image search",
    });
  }
};




