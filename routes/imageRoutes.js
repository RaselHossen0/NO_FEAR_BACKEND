const express = require('express');
const { uploadImage, searchImages } = require('../controllers/imageControllers');
const router = express.Router();

// Route to upload image
router.post('/upload', uploadImage);

// Route to search images
router.get('/search', searchImages);

module.exports = router;
