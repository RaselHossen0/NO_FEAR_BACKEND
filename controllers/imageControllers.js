const path = require('path');
const fs = require('fs');
const { analyzeImage } = require('../config/azure');
const Image = require('../models/Image');


// Image upload handler
exports.uploadImage = async (req, res) => {
  try {
    // Save the image to your server
    const imageFile = req.files.image; // Assuming you're using an image upload middleware like express-fileupload
    const uploadPath = path.join(__dirname, '../uploads', imageFile.name);
    await imageFile.mv(uploadPath);

    // Create a URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageFile.name}`;

    // Analyze image via Azure
    const { tags, description } = await analyzeImage(imageUrl);

    // Save image URL and tags in the database
    const newImage = await Image.create({
      imageUrl,
      tags: { tags, description }
    });

    res.status(200).json({ message: 'Image uploaded and analyzed successfully', data: newImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};

// Search images based on a query
exports.searchImages = async (req, res) => {
    const query = req.query.q;

    try {
        // Use Azure Cognitive Search for advanced natural language querying
        const searchResults = await searchImagesInAzure(query);

        // Extract image URLs from search results
        const imageUrls = searchResults.map(result => result.imageUrl);

        // Find images in the database based on the URLs returned by Azure Cognitive Search
        const images = await Image.findAll({
            where: {
                imageUrl: {
                    [Op.in]: imageUrls
                }
            }
        });

        res.status(200).json({ data: images });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to search images', error: error.message });
    }
};
