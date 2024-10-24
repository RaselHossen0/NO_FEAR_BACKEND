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

  // In the future, you can integrate Azure Cognitive Search for more advanced natural language querying
  // Currently, we're doing a simple keyword match in the tags
  try {
    const images = await Image.findAll({
      where: {
        tags: {
          [Op.like]: `%${query}%`
        }
      }
    });

    res.status(200).json({ data: images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to search images', error: error.message });
  }
};
