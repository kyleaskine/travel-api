const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
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
    // In production, you might use a CDN or cloud storage URL
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

// @desc    Add media to segment
// @route   POST /api/media/segment/:tripId/:segmentId
// @access  Public (would typically be Private with auth)
router.post('/segment/:tripId/:segmentId', async (req, res) => {
  try {
    const { tripId, segmentId } = req.params;
    const { type, content, caption } = req.body;
    
    // Basic validation
    if (!type || !content) {
      return res.status(400).json({ message: 'Please provide type and content' });
    }
    
    if (type !== 'photo' && type !== 'note') {
      return res.status(400).json({ message: 'Type must be photo or note' });
    }
    
    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Find the segment
    const segmentIndex = trip.segments.findIndex(s => s._id.toString() === segmentId);
    if (segmentIndex === -1) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    // Create the new media item
    const newMedia = {
      type,
      content,
      caption,
      dateCreated: new Date()
    };
    
    // Add the media to the segment
    if (!trip.segments[segmentIndex].media) {
      trip.segments[segmentIndex].media = [];
    }
    
    trip.segments[segmentIndex].media.push(newMedia);
    
    // Save the trip
    await trip.save();
    
    res.status(201).json({
      message: 'Media added successfully',
      media: newMedia
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add media to stay
// @route   POST /api/media/stay/:tripId/:stayId
// @access  Public (would typically be Private with auth)
router.post('/stay/:tripId/:stayId', async (req, res) => {
  try {
    const { tripId, stayId } = req.params;
    const { type, content, caption } = req.body;
    
    // Basic validation
    if (!type || !content) {
      return res.status(400).json({ message: 'Please provide type and content' });
    }
    
    if (type !== 'photo' && type !== 'note') {
      return res.status(400).json({ message: 'Type must be photo or note' });
    }
    
    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Find the stay
    const stayIndex = trip.stays.findIndex(s => s._id.toString() === stayId);
    if (stayIndex === -1) {
      return res.status(404).json({ message: 'Stay not found' });
    }
    
    // Create the new media item
    const newMedia = {
      type,
      content,
      caption,
      dateCreated: new Date()
    };
    
    // Add the media to the stay
    if (!trip.stays[stayIndex].media) {
      trip.stays[stayIndex].media = [];
    }
    
    trip.stays[stayIndex].media.push(newMedia);
    
    // Save the trip
    await trip.save();
    
    res.status(201).json({
      message: 'Media added successfully',
      media: newMedia
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete media from segment
// @route   DELETE /api/media/segment/:tripId/:segmentId/:mediaId
// @access  Public (would typically be Private with auth)
router.delete('/segment/:tripId/:segmentId/:mediaId', async (req, res) => {
  try {
    const { tripId, segmentId, mediaId } = req.params;
    
    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Find the segment
    const segment = trip.segments.id(segmentId);
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    // Find and remove the media
    if (!segment.media || segment.media.length === 0) {
      return res.status(404).json({ message: 'No media found for this segment' });
    }
    
    const mediaIndex = segment.media.findIndex(m => m._id.toString() === mediaId);
    if (mediaIndex === -1) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    // If it's a photo, you might want to delete the file from storage
    const media = segment.media[mediaIndex];
    if (media.type === 'photo' && media.content.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', media.content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Remove the media from the array
    segment.media.splice(mediaIndex, 1);
    
    // Save the trip
    await trip.save();
    
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete media from stay
// @route   DELETE /api/media/stay/:tripId/:stayId/:mediaId
// @access  Public (would typically be Private with auth)
router.delete('/stay/:tripId/:stayId/:mediaId', async (req, res) => {
  try {
    const { tripId, stayId, mediaId } = req.params;
    
    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Find the stay
    const stay = trip.stays.id(stayId);
    if (!stay) {
      return res.status(404).json({ message: 'Stay not found' });
    }
    
    // Find and remove the media
    if (!stay.media || stay.media.length === 0) {
      return res.status(404).json({ message: 'No media found for this stay' });
    }
    
    const mediaIndex = stay.media.findIndex(m => m._id.toString() === mediaId);
    if (mediaIndex === -1) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    // If it's a photo, you might want to delete the file from storage
    const media = stay.media[mediaIndex];
    if (media.type === 'photo' && media.content.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', media.content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Remove the media from the array
    stay.media.splice(mediaIndex, 1);
    
    // Save the trip
    await trip.save();
    
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;