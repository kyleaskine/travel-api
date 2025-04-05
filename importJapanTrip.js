const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: './.env' });

// Import trip model
const Trip = require('./models/Trip');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import Japan trip data
const importJapanTrip = async () => {
  try {
    // Clean up existing data (optional)
    await Trip.deleteMany({ tripName: 'Japan Adventure 2025' });
    
    // Japan trip data from your frontend file
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
        {
          "date": "2025-02-17",
          "type": "flight",
          "transport": "NH 11",
          "origin": {
            "name": "O'Hare International Airport (ORD)",
            "code": "ORD",
            "coordinates": [41.9742, -87.9073]
          },
          "destination": {
            "name": "Narita International Airport (NRT)",
            "code": "NRT",
            "coordinates": [35.7720, 140.3929]
          }
        },
        {
          "date": "2025-02-18",
          "type": "train",
          "transport": "Skyliner",
          "origin": {
            "name": "Narita Airport Terminal 1",
            "code": "NRT T1",
            "coordinates": [35.7647, 140.3864]
          },
          "destination": {
            "name": "Nippori Station",
            "coordinates": [35.7281, 139.7703]
          }
        },
        {
          "date": "2025-02-18",
          "type": "train",
          "transport": "JR Line",
          "origin": {
            "name": "Nippori Station",
            "coordinates": [35.7281, 139.7703]
          },
          "destination": {
            "name": "Shinjuku Station",
            "coordinates": [35.6896, 139.7006]
          }
        },
        {
          "date": "2025-02-19",
          "type": "train",
          "transport": "Shonan Shinjuku Line",
          "origin": {
            "name": "Shinjuku Station",
            "coordinates": [35.6896, 139.7006]
          },
          "destination": {
            "name": "Omiya Station",
            "coordinates": [35.9063, 139.6234]
          }
        },
        {
          "date": "2025-02-19",
          "type": "train",
          "transport": "Joetsu Shinkansen",
          "origin": {
            "name": "Omiya Station",
            "coordinates": [35.9063, 139.6234]
          },
          "destination": {
            "name": "Echigo-Yuzawa Station",
            "coordinates": [36.935862, 138.809237]
          }
        },
        {
          "date": "2025-02-19",
          "type": "shuttle",
          "transport": "Hotel Shuttle",
          "origin": {
            "name": "Echigo-Yuzawa Station",
            "coordinates": [36.935862, 138.809237]
          },
          "destination": {
            "name": "Satoyama Jujo",
            "coordinates": [37.020567, 138.801704]
          }
        },
        {
          "date": "2025-02-20",
          "type": "shuttle",
          "transport": "Hotel Shuttle",
          "origin": {
            "name": "Satoyama Jujo",
            "coordinates": [37.020567, 138.801704]
          },
          "destination": {
            "name": "Echigo-Yuzawa Station",
            "coordinates": [36.935862, 138.809237]
          }
        },
        {
          "date": "2025-02-20",
          "type": "shuttle",
          "transport": "Hotel Shuttle",
          "origin": {
            "name": "Echigo-Yuzawa Station",
            "coordinates": [36.935862, 138.809237]
          },
          "destination": {
            "name": "Ryugon",
            "coordinates": [37.058056, 138.883397]
          }
        },
        {
          "date": "2025-02-21",
          "type": "shuttle",
          "transport": "Hotel Shuttle",
          "origin": {
            "name": "Ryugon",
            "coordinates": [37.058056, 138.883397]
          },
          "destination": {
            "name": "Echigo-Yuzawa Station",
            "coordinates": [36.935862, 138.809237]
          }
        },
        {
          "date": "2025-02-21",
          "type": "train",
          "transport": "Joetsu Shinkansen",
          "origin": {
            "name": "Echigo-Yuzawa Station",
            "coordinates": [36.935862, 138.809237]
          },
          "destination": {
            "name": "Omiya Station",
            "coordinates": [35.9063, 139.6234]
          }
        },
        {
          "date": "2025-02-21",
          "type": "train",
          "transport": "Takasaki Line",
          "origin": {
            "name": "Omiya Station",
            "coordinates": [35.9063, 139.6234]
          },
          "destination": {
            "name": "Yokohama Station",
            "coordinates": [35.4657, 139.6223]
          }
        },
        {
          "date": "2025-02-21",
          "type": "walk",
          "transport": "Walking",
          "origin": {
            "name": "Yokohama Station",
            "coordinates": [35.4657, 139.6223]
          },
          "destination": {
            "name": "Hyatt Regency Yokohama",
            "coordinates": [35.445859, 139.645263]
          }
        },
        {
          "date": "2025-02-22",
          "type": "bus",
          "transport": "Limousine Bus",
          "origin": {
            "name": "Yokohama Chinatown (Chukagai)",
            "coordinates": [35.443927, 139.646748]
          },
          "destination": {
            "name": "Haneda Airport Terminal 3",
            "code": "HND T3",
            "coordinates": [35.544512, 139.767891]
          }
        },
        {
          "date": "2025-02-22",
          "type": "flight",
          "transport": "JL 10",
          "origin": {
            "name": "Haneda Airport (HND)",
            "code": "HND",
            "coordinates": [35.544512, 139.767891]
          },
          "destination": {
            "name": "O'Hare International Airport (ORD)",
            "code": "ORD",
            "coordinates": [41.9742, -87.9073]
          }
        },
        {
          "date": "2025-02-22",
          "type": "flight",
          "transport": "AA 4528",
          "origin": {
            "name": "O'Hare International Airport (ORD)",
            "code": "ORD",
            "coordinates": [41.9742, -87.9073]
          },
          "destination": {
            "name": "Ronald Reagan Washington National Airport (DCA)",
            "code": "DCA",
            "coordinates": [38.8512, -77.0402]
          }
        }
      ],
      "stays": [
        {
          "location": "Hilton Garden Inn O'Hare",
          "coordinates": [42.000855, -87.864553],
          "dateStart": "2025-02-16",
          "dateEnd": "2025-02-17",
          "notes": "Airport hotel before Japan flight"
        },
        {
          "location": "Hyatt Regency Tokyo",
          "coordinates": [35.691091, 139.691477],
          "dateStart": "2025-02-18",
          "dateEnd": "2025-02-19",
          "notes": "First night in Japan"
        },
        {
          "location": "Satoyama Jujo",
          "coordinates": [37.020567, 138.801704],
          "dateStart": "2025-02-19",
          "dateEnd": "2025-02-20",
          "notes": "Luxury ryokan experience"
        },
        {
          "location": "Ryugon",
          "coordinates": [37.058056, 138.883397],
          "dateStart": "2025-02-20",
          "dateEnd": "2025-02-21",
          "notes": "Traditional ryokan"
        },
        {
          "location": "Hyatt Regency Yokohama",
          "coordinates": [35.445859, 139.645263],
          "dateStart": "2025-02-21",
          "dateEnd": "2025-02-22",
          "notes": "Last night in Japan"
        }
      ]
    };
    
    // Create and save trip
    const trip = new Trip(japanTripData);
    const createdTrip = await trip.save();
    
    console.log('Japan trip data imported successfully!');
    console.log(`Created trip with ID: ${createdTrip._id}`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    
  } catch (error) {
    console.error('Error importing Japan trip data:', error);
    process.exit(1);
  }
};

// Run the import
importJapanTrip();