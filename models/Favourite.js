const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true, // For faster queries by email
  },
  movieIds: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Favourite', favouriteSchema);