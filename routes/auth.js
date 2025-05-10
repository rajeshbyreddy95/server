// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const connectMongoose = require('../config/db');

// Signup Route
router.post('/signup', async (req, res) => {
  const { email, username, name, password, confirmPassword } = req.body;
  console.log('authRoutes loaded');

  try {
    const connected = await connectMongoose();
    if (!connected) {
      return res.status(503).json({ message: 'Database unavailable, please try again later' });
    }

    if (!email || !username || !name || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, username, name, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to register user', details: error.message });
  }
});

module.exports = router;
