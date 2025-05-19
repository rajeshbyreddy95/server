const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// MongoDB connection function
const connectDB = async () => {
  try {
    // Ensure MONGODB_URI is defined
    const mongoURI = process.env.MONGODB_SRV;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      // Removed deprecated options (useNewUrlParser, useUnifiedTopology)
      // Modern Mongoose uses these by default
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit process with failure code
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from database');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;