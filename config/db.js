// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectMongoose = async () => {
  if (isConnected) return true;

  try {
    await mongoose.connect(process.env.MONGODB_SRV, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    return false;
  }
};

module.exports = connectMongoose;
