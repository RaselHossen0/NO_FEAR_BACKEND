const axios = require('axios');

const azureConfig = {
  endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT,
  key: process.env.AZURE_COMPUTER_VISION_KEY
};

// Function to analyze image using Azure Computer Vision API
async function analyzeImage(imageUrl) {
  const url = `$https://hackathon-try.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Description,Tags`;

  try {
    const response = await axios.post(url, { url: imageUrl }, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureConfig.key,
        'Content-Type': 'application/json'
      }
    });

    const analysis = response.data;
    const tags = analysis.tags.map(tag => tag.name);
    const description = analysis.description.captions[0]?.text || '';
    
    return { tags, description };
  } catch (error) {
    console.error('Error analyzing image:', error.message);
    throw new Error('Failed to analyze image');
  }
}

module.exports = { analyzeImage };
