const Trip = require('../models/Trip');

// @desc    Get all trips
// @route   GET /api/trips
// @access  Public
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({});
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single trip by ID
// @route   GET /api/trips/:id
// @access  Public
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    res.json(trip);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Public (would typically be Private with auth)
const createTrip = async (req, res) => {
  try {
    const { tripName, segments, stays } = req.body;

    // Basic validation
    if (!tripName || !segments || !stays) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const trip = new Trip({
      tripName,
      segments,
      stays
    });

    const createdTrip = await trip.save();
    res.status(201).json(createdTrip);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a trip
// @route   PUT /api/trips/:id
// @access  Public (would typically be Private with auth)
const updateTrip = async (req, res) => {
  try {
    const { tripName, segments, stays } = req.body;

    // Find the trip to update
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Update trip fields
    trip.tripName = tripName || trip.tripName;
    
    // Only update segments or stays if provided
    if (segments) trip.segments = segments;
    if (stays) trip.stays = stays;

    // Save the updated trip
    const updatedTrip = await trip.save();
    res.json(updatedTrip);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Public (would typically be Private with auth)
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    await trip.remove();
    res.json({ message: 'Trip removed' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Import Japan trip data
// @route   POST /api/trips/import-japan
// @access  Public (would typically be Private with auth)
const importJapanTrip = async (req, res) => {
  try {
    // Check if Japan trip already exists
    const existingTrip = await Trip.findOne({ tripName: 'Japan Adventure 2025' });
    
    if (existingTrip) {
      return res.status(400).json({ message: 'Japan trip already imported' });
    }
    
    // Sample data structure based on your frontend japan-trip-data.js
    const japanTripData = {
      "tripName": "Japan Adventure 2025",
      "segments": [
        {
          "date": "2025-02-16",
          "type": "flight",
          "transport": "AA 3180",
          "origin": {
            "name": "Ronald Reagan Washington National Airport (DCA)",
            "code": "DCA",
            "coordinates": [38.8512, -77.0402]
          },
          "destination": {
            "name": "O'Hare International Airport (ORD)",
            "code": "ORD",
            "coordinates": [41.9742, -87.9073]
          }
        },
        // Add more segments here as needed
      ],
      "stays": [
        {
          "location": "Hilton Garden Inn O'Hare",
          "coordinates": [42.000855, -87.864553],
          "dateStart": "2025-02-16",
          "dateEnd": "2025-02-17",
          "notes": "Airport hotel before Japan flight"
        },
        // Add more stays here as needed
      ]
    };
    
    const trip = new Trip(japanTripData);
    const createdTrip = await trip.save();
    
    res.status(201).json(createdTrip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  importJapanTrip
};