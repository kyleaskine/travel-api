const mongoose = require('mongoose');

// Reuse the same media schema from Trip model
const mediaSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['photo', 'note']
  },
  content: { 
    type: String, 
    required: true 
  }, // URL for photos, text content for notes
  caption: String,
  dateCreated: { 
    type: Date, 
    default: Date.now 
  }
});

const albumSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tripId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true 
  },
  itemType: { 
    type: String, 
    required: true, 
    enum: ['segment', 'stay'] 
  },
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  coverImageIndex: { 
    type: Number, 
    default: 0 
  },
  media: [mediaSchema],
  dateCreated: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// Virtual for getting cover image
albumSchema.virtual('coverImage').get(function() {
  if (!this.media || this.media.length === 0) {
    return null;
  }
  
  // Use the specified cover image index if valid
  if (this.coverImageIndex >= 0 && this.coverImageIndex < this.media.length) {
    return this.media[this.coverImageIndex];
  }
  
  // Otherwise, find the first photo in the album
  const firstPhoto = this.media.find(item => item.type === 'photo');
  if (firstPhoto) {
    return firstPhoto;
  }
  
  // If no photos, just return the first media item
  return this.media[0];
});

module.exports = mongoose.model('Album', albumSchema);