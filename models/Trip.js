const mongoose = require('mongoose');

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

const pointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: String,
  coordinates: { 
    type: [Number], 
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2;
      },
      message: 'Coordinates must be [latitude, longitude]'
    }
  }
});

const segmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['flight', 'train', 'shuttle', 'walk', 'bus']
  },
  transport: { type: String, required: true },
  origin: { type: pointSchema, required: true },
  destination: { type: pointSchema, required: true },
  notes: String,
  media: [mediaSchema] // Add media to segments
}, { 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true },
  id: false 
});

// Virtual for segment ID to maintain compatibility with frontend
segmentSchema.virtual('id').get(function() {
  return this._id.toString();
});

const staySchema = new mongoose.Schema({
  location: { type: String, required: true },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2;
      },
      message: 'Coordinates must be [latitude, longitude]'
    }
  },
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  notes: String,
  amenities: [String],
  media: [mediaSchema] // Add media to stays
}, { 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

const tripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  dateRange: String,
  // Calculated fields that get derived from segments and stays
  startDate: Date,
  endDate: Date,
  segments: [segmentSchema],
  stays: [staySchema],
  coverImage: String, // Optional URL for a trip cover image
  description: String // Optional trip description
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// Add a pre-save hook to calculate the date range
tripSchema.pre('save', function(next) {
  // Extract all dates
  const segmentDates = this.segments.map(segment => new Date(segment.date));
  const stayStartDates = this.stays.map(stay => new Date(stay.dateStart));
  const stayEndDates = this.stays.map(stay => new Date(stay.dateEnd));
  
  const allDates = [...segmentDates, ...stayStartDates, ...stayEndDates];
  
  if (allDates.length > 0) {
    this.startDate = new Date(Math.min(...allDates));
    this.endDate = new Date(Math.max(...allDates));
    
    // Format the date range
    const formatDate = (date) => {
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };
    
    const year = this.endDate.getFullYear();
    this.dateRange = `${formatDate(this.startDate)} - ${formatDate(this.endDate)}, ${year}`;
  }
  
  next();
});

module.exports = mongoose.model('Trip', tripSchema);