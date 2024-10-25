

const express = require('express');
const router = express.Router();
const albumController = require('../controllers/Album');

// Create a new album
router.post('/', albumController.createAlbum);

// Get all albums
router.get('/', albumController.getAllAlbums);

// Get all albums by trip ID
router.get('/trip/:tripId', albumController.getAlbumsByTripId);

// Get a single album by ID
router.get('/:id', albumController.getAlbumById);

// Update an album by ID
router.put('/:id', albumController.updateAlbum);

// Delete an album by ID
router.delete('/:id', albumController.deleteAlbum);

// Upload image to album
router.post('/:albumId/upload', albumController.uploadImageToAlbum);

//query Images

router.post('/query/:albumId', albumController.queryImage);

module.exports = router;
