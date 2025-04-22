const mongoose = require('mongoose');

/**
 * MediaItem schema for photos and notes
 * Now separated from Album to support the album-centric architecture
 */
const mediaItemSchema = new mongoose.Schema({
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true,
    index: true // Add index for performance
  },
  type: { 
    type: String, 
    required: true,
    enum: ['photo', 'note'],
    index: true // Add index for filtering by type
  },
  content: { 
    type: String, 
    required: true 
  }, // URL for photos, text content for notes
  caption: String,
  dateCreated: { 
    type: Date, 
    default: Date.now 
  },
  metadata: {
    type: Map,
    of: String,
    default: {} // For flexible storage of metadata like location, camera info, etc.
  },
  sortOrder: {
    type: Number,
    default: 0 // For manual ordering within an album
  }
}, {
  timestamps: true
});

// Create a compound index for better performance when querying media by album and type
mediaItemSchema.index({ albumId: 1, type: 1 });

// Method to check if item is a photo
mediaItemSchema.methods.isPhoto = function() {
  return this.type === 'photo';
};

// Method to check if item is a note
mediaItemSchema.methods.isNote = function() {
  return this.type === 'note';
};

module.exports = mongoose.model('MediaItem', mediaItemSchema);