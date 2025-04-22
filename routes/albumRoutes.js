const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const MediaItem = require('../models/MediaItem');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

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

// @desc    Get albums for a specific trip with media counts
// @route   GET /api/albums/trip/:tripId
// @access  Public (would typically be Private with auth)
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Find all albums for this trip
    const albums = await Album.find({ tripId });
    
    // For each album, get the media counts and coverage image
    const albumsWithCounts = await Promise.all(albums.map(async (album) => {
      const photoCount = await MediaItem.countDocuments({ 
        albumId: album._id,
        type: 'photo'
      });
      
      const noteCount = await MediaItem.countDocuments({ 
        albumId: album._id,
        type: 'note'
      });
      
      // If there's a coverImageId, fetch that image
      let coverImage = null;
      if (album.coverImageId) {
        const coverImageDoc = await MediaItem.findById(album.coverImageId);
        if (coverImageDoc) {
          coverImage = coverImageDoc;
        }
      }
      
      // If no cover image is set, find the first photo
      if (!coverImage) {
        coverImage = await MediaItem.findOne({ 
          albumId: album._id,
          type: 'photo'
        });
      }
      
      return {
        ...album.toObject(),
        photoCount,
        noteCount,
        totalItems: photoCount + noteCount,
        coverImage
      };
    }));
    
    res.json(albumsWithCounts);
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
    
    // Find albums for this item
    const albums = await Album.find({ 
      tripId,
      'relatedItem.type': itemType,
      'relatedItem.itemId': itemId
    });
    
    // Add media counts and cover images
    const albumsWithDetails = await Promise.all(albums.map(async (album) => {
      const photoCount = await MediaItem.countDocuments({ 
        albumId: album._id,
        type: 'photo'
      });
      
      const noteCount = await MediaItem.countDocuments({ 
        albumId: album._id,
        type: 'note'
      });
      
      // If there's a coverImageId, fetch that image
      let coverImage = null;
      if (album.coverImageId) {
        const coverImageDoc = await MediaItem.findById(album.coverImageId);
        if (coverImageDoc) {
          coverImage = coverImageDoc;
        }
      }
      
      // If no cover image is set, find the first photo
      if (!coverImage) {
        coverImage = await MediaItem.findOne({ 
          albumId: album._id,
          type: 'photo'
        });
      }
      
      return {
        ...album.toObject(),
        photoCount,
        noteCount,
        totalItems: photoCount + noteCount,
        coverImage
      };
    }));
    
    res.json(albumsWithDetails);
  } catch (error) {
    console.error(`Error fetching albums for ${req.params.itemType} ${req.params.itemId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get a single album by ID with media items
// @route   GET /api/albums/:id
// @access  Public (would typically be Private with auth)
router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Get all media items for this album
    const mediaItems = await MediaItem.find({ albumId: album._id })
      .sort({ sortOrder: 1, dateCreated: -1 }); // Sort by manual order, then by date
    
    // Get related item info (segment or stay)
    let relatedItemInfo = null;
    if (album.relatedItem && album.relatedItem.type !== 'trip') {
      const trip = await Trip.findById(album.tripId);
      
      if (trip) {
        if (album.relatedItem.type === 'segment') {
          const segment = trip.segments.id(album.relatedItem.itemId);
          if (segment) {
            relatedItemInfo = {
              id: segment._id,
              type: 'segment',
              name: segment.transport,
              description: `${segment.origin.name} → ${segment.destination.name}`,
              date: segment.date
            };
          }
        } else if (album.relatedItem.type === 'stay') {
          const stay = trip.stays.id(album.relatedItem.itemId);
          if (stay) {
            relatedItemInfo = {
              id: stay._id,
              type: 'stay',
              name: stay.location,
              description: `${stay.dateStart} - ${stay.dateEnd}`,
              date: stay.dateStart
            };
          }
        }
      }
    }
    
    res.json({
      ...album.toObject(),
      mediaItems,
      relatedItemInfo
    });
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
    const { name, description, tripId, relatedItem, isDefault } = req.body;

    // Basic validation
    if (!name || !tripId) {
      return res.status(400).json({ message: 'Please provide a name and tripId' });
    }

    // Create the new album
    const album = new Album({
      name,
      description,
      tripId,
      relatedItem: relatedItem || { type: 'trip' },
      isDefault: isDefault || false
    });

    const createdAlbum = await album.save();
    
    // If this is a default album, update the related item
    if (isDefault && relatedItem && relatedItem.type !== 'trip') {
      const trip = await Trip.findById(tripId);
      
      if (trip) {
        if (relatedItem.type === 'segment') {
          const segment = trip.segments.id(relatedItem.itemId);
          if (segment) {
            segment.defaultAlbumId = createdAlbum._id;
          }
        } else if (relatedItem.type === 'stay') {
          const stay = trip.stays.id(relatedItem.itemId);
          if (stay) {
            stay.defaultAlbumId = createdAlbum._id;
          }
        }
        
        await trip.save();
      }
    }
    
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

// @desc    Create a default album for a segment or stay
// @route   POST /api/albums/default/:tripId/:itemType/:itemId
// @access  Public (would typically be Private with auth)
router.post('/default/:tripId/:itemType/:itemId', async (req, res) => {
  try {
    const { tripId, itemType, itemId } = req.params;
    
    // Validate item type
    if (itemType !== 'segment' && itemType !== 'stay') {
      return res.status(400).json({ message: 'Invalid item type. Must be "segment" or "stay"' });
    }
    
    // Check if trip and item exist
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    let itemExists = false;
    let itemName = '';
    
    if (itemType === 'segment') {
      const segment = trip.segments.id(itemId);
      if (segment) {
        itemExists = true;
        itemName = `${segment.transport}: ${segment.origin.name} to ${segment.destination.name}`;
      }
    } else {
      const stay = trip.stays.id(itemId);
      if (stay) {
        itemExists = true;
        itemName = stay.location;
      }
    }
    
    if (!itemExists) {
      return res.status(404).json({ message: `${itemType} not found` });
    }
    
    // Check if a default album already exists
    const existingDefaultAlbum = await Album.findOne({
      tripId,
      'relatedItem.type': itemType,
      'relatedItem.itemId': itemId,
      isDefault: true
    });
    
    if (existingDefaultAlbum) {
      return res.status(400).json({ 
        message: 'Default album already exists',
        albumId: existingDefaultAlbum._id
      });
    }
    
    // Create a new default album
    const album = new Album({
      name: `${itemName} Album`,
      description: `Default album for ${itemName}`,
      tripId,
      relatedItem: {
        type: itemType,
        itemId
      },
      isDefault: true
    });
    
    const createdAlbum = await album.save();
    
    // Update the item with the default album reference
    if (itemType === 'segment') {
      const segment = trip.segments.id(itemId);
      if (segment) {
        segment.defaultAlbumId = createdAlbum._id;
      }
    } else {
      const stay = trip.stays.id(itemId);
      if (stay) {
        stay.defaultAlbumId = createdAlbum._id;
      }
    }
    
    await trip.save();
    
    res.status(201).json(createdAlbum);
  } catch (error) {
    console.error('Error creating default album:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Public (would typically be Private with auth)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, coverImageId } = req.body;

    // Find the album
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Update fields
    if (name) album.name = name;
    if (description !== undefined) album.description = description;
    if (coverImageId) {
      // Validate that the coverImageId exists and belongs to this album
      const coverImage = await MediaItem.findOne({ 
        _id: coverImageId, 
        albumId: album._id,
        type: 'photo'
      });
      
      if (coverImage) {
        album.coverImageId = coverImageId;
      } else {
        return res.status(400).json({ 
          message: 'Invalid cover image ID or not a photo in this album'
        });
      }
    }
    
    album.lastUpdated = new Date();
    
    // Save the updated album
    const updatedAlbum = await album.save();
    
    res.json(updatedAlbum);
  } catch (error) {
    console.error(`Error updating album ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete an album and its media
// @route   DELETE /api/albums/:id
// @access  Public (would typically be Private with auth)
router.delete('/:id', async (req, res) => {
  try {
    // Find the album
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // If this is a default album, check if there are other albums for this item
    if (album.isDefault && album.relatedItem && album.relatedItem.type !== 'trip') {
      const otherAlbums = await Album.find({
        tripId: album.tripId,
        'relatedItem.type': album.relatedItem.type,
        'relatedItem.itemId': album.relatedItem.itemId,
        _id: { $ne: album._id }
      });
      
      // If this is the only album, don't allow deletion
      if (otherAlbums.length === 0) {
        return res.status(400).json({ 
          message: 'Cannot delete the only album for this item. Create another album first.'
        });
      }
      
      // Update the related item to use another album as default
      const trip = await Trip.findById(album.tripId);
      if (trip) {
        if (album.relatedItem.type === 'segment') {
          const segment = trip.segments.id(album.relatedItem.itemId);
          if (segment) {
            segment.defaultAlbumId = otherAlbums[0]._id;
            otherAlbums[0].isDefault = true;
            await otherAlbums[0].save();
          }
        } else if (album.relatedItem.type === 'stay') {
          const stay = trip.stays.id(album.relatedItem.itemId);
          if (stay) {
            stay.defaultAlbumId = otherAlbums[0]._id;
            otherAlbums[0].isDefault = true;
            await otherAlbums[0].save();
          }
        }
        
        await trip.save();
      }
    }
    
    // Delete all media items in this album
    await MediaItem.deleteMany({ albumId: album._id });
    
    // Delete the album
    await album.remove();
    
    res.json({ message: 'Album and all its media deleted' });
  } catch (error) {
    console.error(`Error deleting album ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Album not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;