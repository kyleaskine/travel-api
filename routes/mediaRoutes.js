const express = require('express');
const router = express.Router();
const MediaItem = require('../models/MediaItem');
const Album = require('../models/Album');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @desc    Upload photo
// @route   POST /api/media/upload
// @access  Public (would typically be Private with auth)
router.post('/upload', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the file path that can be accessed publicly
    const filePath = `/uploads/${req.file.filename}`;
    
    res.status(201).json({
      message: 'File uploaded successfully',
      url: filePath
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all media items for an album
// @route   GET /api/media/album/:albumId
// @access  Public (would typically be Private with auth)
router.get('/album/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    
    // Validate albumId
    if (!albumId) {
      return res.status(400).json({ message: 'Album ID is required' });
    }
    
    // Check if album exists
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Get all media items for this album
    const mediaItems = await MediaItem.find({ albumId })
      .sort({ sortOrder: 1, dateCreated: -1 }); // Sort by manual order, then by date
    
    res.json(mediaItems);
  } catch (error) {
    console.error(`Error fetching media for album ${req.params.albumId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add media to an album
// @route   POST /api/media/album/:albumId
// @access  Public (would typically be Private with auth)
router.post('/album/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { type, content, caption } = req.body;
    
    // Basic validation
    if (!type || !content) {
      return res.status(400).json({ message: 'Please provide type and content' });
    }
    
    if (type !== 'photo' && type !== 'note') {
      return res.status(400).json({ message: 'Type must be photo or note' });
    }
    
    // Check if album exists
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    
    // Create new media item
    const mediaItem = new MediaItem({
      albumId,
      type,
      content,
      caption,
      dateCreated: new Date()
    });
    
    // Save the media item
    const savedMediaItem = await mediaItem.save();
    
    // If this is a photo and the album has no cover image, set this as the cover
    if (type === 'photo' && !album.coverImageId) {
      album.coverImageId = savedMediaItem._id;
      await album.save();
    }
    
    // Update the lastUpdated timestamp on the album
    album.lastUpdated = new Date();
    await album.save();
    
    res.status(201).json(savedMediaItem);
  } catch (error) {
    console.error(`Error adding media to album ${req.params.albumId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get a single media item
// @route   GET /api/media/:id
// @access  Public (would typically be Private with auth)
router.get('/:id', async (req, res) => {
  try {
    const mediaItem = await MediaItem.findById(req.params.id);
    
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    res.json(mediaItem);
  } catch (error) {
    console.error(`Error fetching media item ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Media item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a media item
// @route   PUT /api/media/:id
// @access  Public (would typically be Private with auth)
router.put('/:id', async (req, res) => {
  try {
    const { caption, sortOrder } = req.body;
    
    // Find the media item
    const mediaItem = await MediaItem.findById(req.params.id);
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    // Update fields
    if (caption !== undefined) mediaItem.caption = caption;
    if (sortOrder !== undefined) mediaItem.sortOrder = sortOrder;
    
    // Save the updated media item
    const updatedMediaItem = await mediaItem.save();
    
    // Update the lastUpdated timestamp on the album
    const album = await Album.findById(mediaItem.albumId);
    if (album) {
      album.lastUpdated = new Date();
      await album.save();
    }
    
    res.json(updatedMediaItem);
  } catch (error) {
    console.error(`Error updating media item ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Media item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a media item
// @route   DELETE /api/media/:id
// @access  Public (would typically be Private with auth)
router.delete('/:id', async (req, res) => {
  try {
    // Find the media item
    const mediaItem = await MediaItem.findById(req.params.id);
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    // Store the albumId before deletion
    const albumId = mediaItem.albumId;
    
    // If this is a photo and it's used as a cover image, update the album
    const album = await Album.findById(albumId);
    if (album && album.coverImageId && album.coverImageId.toString() === req.params.id) {
      // Find another photo to use as cover
      const anotherPhoto = await MediaItem.findOne({
        albumId,
        type: 'photo',
        _id: { $ne: req.params.id }
      });
      
      if (anotherPhoto) {
        album.coverImageId = anotherPhoto._id;
      } else {
        album.coverImageId = null;
      }
      
      await album.save();
    }
    
    // If it's a photo, delete the file from disk
    if (mediaItem.type === 'photo' && mediaItem.content.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', mediaItem.content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete the media item
    await mediaItem.remove();
    
    // Update the lastUpdated timestamp on the album
    if (album) {
      album.lastUpdated = new Date();
      await album.save();
    }
    
    res.json({ message: 'Media item deleted' });
  } catch (error) {
    console.error(`Error deleting media item ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Media item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Move media item to another album
// @route   PUT /api/media/:id/move/:targetAlbumId
// @access  Public (would typically be Private with auth)
router.put('/:id/move/:targetAlbumId', async (req, res) => {
  try {
    const { id, targetAlbumId } = req.params;
    
    // Find the media item
    const mediaItem = await MediaItem.findById(id);
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    // Check if target album exists
    const targetAlbum = await Album.findById(targetAlbumId);
    if (!targetAlbum) {
      return res.status(404).json({ message: 'Target album not found' });
    }
    
    // Check if this is a cover image for the current album
    const sourceAlbum = await Album.findById(mediaItem.albumId);
    if (sourceAlbum && sourceAlbum.coverImageId && sourceAlbum.coverImageId.toString() === id) {
      // Find another photo to use as cover
      const anotherPhoto = await MediaItem.findOne({
        albumId: mediaItem.albumId,
        type: 'photo',
        _id: { $ne: id }
      });
      
      if (anotherPhoto) {
        sourceAlbum.coverImageId = anotherPhoto._id;
      } else {
        sourceAlbum.coverImageId = null;
      }
      
      sourceAlbum.lastUpdated = new Date();
      await sourceAlbum.save();
    }
    
    // Update the media item with the new album ID
    const oldAlbumId = mediaItem.albumId;
    mediaItem.albumId = targetAlbumId;
    const updatedMediaItem = await mediaItem.save();
    
    // Update the lastUpdated timestamp on both albums
    if (sourceAlbum) {
      sourceAlbum.lastUpdated = new Date();
      await sourceAlbum.save();
    }
    
    targetAlbum.lastUpdated = new Date();
    
    // If the target album has no cover image and this is a photo, set it as cover
    if (mediaItem.type === 'photo' && !targetAlbum.coverImageId) {
      targetAlbum.coverImageId = mediaItem._id;
    }
    
    await targetAlbum.save();
    
    res.json({
      message: 'Media item moved to new album',
      mediaItem: updatedMediaItem,
      oldAlbumId,
      newAlbumId: targetAlbumId
    });
  } catch (error) {
    console.error(`Error moving media item ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Media item or album not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;