const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Album = require('../models/Album');

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public (would typically be Private with auth)
router.get('/', async (req, res) => {
  try {
    const albums = await Album.find({});
    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get albums for a specific trip
// @route   GET /api/albums/trip/:tripId
// @access  Public (would typically be Private with auth)
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const albums = await Album.find({ tripId });
    res.json(albums);
  } catch (error) {
    console.error(`Error fetching albums for trip ${req.params.tripId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get albums for a specific item (segment or stay)
// @route   GET /api/albums/trip/:tripId/:itemType/:itemId
// @access  Public (would typically be Private with auth)
router.get('/trip/:tripId/:itemType/:itemId', async (req, res) => {
  try {
    const { tripId, itemType, itemId } = req.params;
    
    // Validate item type
    if (itemType !== 'segment' && itemType !== 'stay') {
      return res.status(400).json({ message: 'Invalid item type. Must be "segment" or "stay"' });
    }
    
    const albums = await Album.find({ 
      tripId, 
      itemType,
      itemId 
    });
    
    res.json(albums);
  } catch (error) {
    console.error(`Error fetching albums for ${req.params.itemType} ${req.params.itemId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get a single album by ID
// @route   GET /api/albums/:id
// @access  Public (would typically be Private with auth)
router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    res.json(album);
  } catch (error) {
    console.error(`Error fetching album ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new album
// @route   POST /api/albums
// @access  Public (would typically be Private with auth)
router.post('/', async (req, res) => {
  try {
    const { name, description, tripId, itemType, itemId, media } = req.body;

    // Basic validation
    if (!name || !tripId || !itemType || !itemId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate item type
    if (itemType !== 'segment' && itemType !== 'stay') {
      return res.status(400).json({ message: 'Invalid item type. Must be "segment" or "stay"' });
    }

    const album = new Album({
      name,
      description,
      tripId,
      itemType,
      itemId,
      media: media || []
    });

    const createdAlbum = await album.save();
    res.status(201).json(createdAlbum);
  } catch (error) {
    console.error('Error creating album:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Public (would typically be Private with auth)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, coverImageIndex } = req.body;

    // Find the album to update
    let album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Update album fields
    album.name = name || album.name;
    if (description !== undefined) album.description = description;
    if (coverImageIndex !== undefined) album.coverImageIndex = coverImageIndex;

    // Save the updated album
    const updatedAlbum = await album.save();
    res.json(updatedAlbum);
  } catch (error) {
    console.error(`Error updating album ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete an album
// @route   DELETE /api/albums/:id
// @access  Public (would typically be Private with auth)
router.delete('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    await album.remove();
    res.json({ message: 'Album removed' });
  } catch (error) {
    console.error(`Error deleting album ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add media to an album
// @route   POST /api/albums/:id/media
// @access  Public (would typically be Private with auth)
router.post('/:id/media', async (req, res) => {
  try {
    const { type, content, caption } = req.body;
    
    // Basic validation
    if (!type || !content) {
      return res.status(400).json({ message: 'Please provide type and content' });
    }
    
    if (type !== 'photo' && type !== 'note') {
      return res.status(400).json({ message: 'Type must be photo or note' });
    }
    
    // Find the album
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Create the new media item
    const newMedia = {
      _id: new mongoose.Types.ObjectId(),
      type,
      content,
      caption,
      dateCreated: new Date()
    };
    
    // Add the media to the album
    album.media.push(newMedia);
    
    // Save the album
    await album.save();
    
    res.status(201).json({
      message: 'Media added successfully',
      media: newMedia,
      album
    });
  } catch (error) {
    console.error(`Error adding media to album ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Remove media from an album
// @route   DELETE /api/albums/:id/media/:mediaId
// @access  Public (would typically be Private with auth)
router.delete('/:id/media/:mediaId', async (req, res) => {
  try {
    const { id, mediaId } = req.params;
    
    // Find the album
    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Find and remove the media
    if (!album.media || album.media.length === 0) {
      return res.status(404).json({ message: 'No media found for this album' });
    }
    
    const mediaIndex = album.media.findIndex(m => m._id.toString() === mediaId);
    if (mediaIndex === -1) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    // Remove the media from the array
    album.media.splice(mediaIndex, 1);
    
    // Update cover image index if needed
    if (mediaIndex === album.coverImageIndex) {
      album.coverImageIndex = 0; // Reset to first image
    } else if (mediaIndex < album.coverImageIndex) {
      album.coverImageIndex = Math.max(0, album.coverImageIndex - 1);
    }
    
    // Save the album
    await album.save();
    
    res.json({ 
      message: 'Media removed successfully',
      album
    });
  } catch (error) {
    console.error(`Error removing media from album:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update album cover image
// @route   PUT /api/albums/:id/cover/:mediaIndex
// @access  Public (would typically be Private with auth)
router.put('/:id/cover/:mediaIndex', async (req, res) => {
  try {
    const { id, mediaIndex } = req.params;
    const coverIndex = parseInt(mediaIndex);
    
    if (isNaN(coverIndex) || coverIndex < 0) {
      return res.status(400).json({ message: 'Invalid media index' });
    }
    
    // Find the album
    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Validate that the index is within range
    if (!album.media || coverIndex >= album.media.length) {
      return res.status(400).json({ message: 'Media index out of range' });
    }
    
    // Update the cover image index
    album.coverImageIndex = coverIndex;
    
    // Save the album
    await album.save();
    
    res.json({ 
      message: 'Album cover updated successfully',
      album
    });
  } catch (error) {
    console.error(`Error updating album cover:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;