const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/albums', require('./routes/albumRoutes')); // New album routes

// Root route for API health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Travel API is running',
    version: '2.0.0', // Updated version for album-centric architecture
    endpoints: [
      '/api/trips',
      '/api/media',
      '/api/albums'
    ]
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});