const mongoose = require('mongoose');

/**
 * Album schema for organizing media items
 */
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
  // Relation to segment or stay (optional - some albums might be trip-level)
  relatedItem: {
    type: { 
      type: String, 
      enum: ['segment', 'stay', 'trip'],
      default: 'trip'
    },
    itemId: { 
      type: mongoose.Schema.Types.ObjectId,
      required: function() { return this.relatedItem.type !== 'trip'; }
    }
  },
  // Album metadata
  coverImageId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaItem' 
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  dateCreated: { 
    type: Date, 
    default: Date.now 
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// Virtual for media items in this album
albumSchema.virtual('mediaItems', {
  ref: 'MediaItem',
  localField: '_id',
  foreignField: 'albumId'
});

// Pre-save hook to update lastUpdated timestamp
albumSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Album', albumSchema);