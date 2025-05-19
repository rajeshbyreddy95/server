const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.signUp = async (req, res) => {
    console.log('====================================');
    console.log("hello world from server signup router");
    console.log('====================================');
  // Check if req.body is defined
  if (!req.body) {
    console.error('Request body is missing');
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { email, username, name, password, confirmPassword } = req.body;

  try {
    // Input validation
    if (!email || !username || !name || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      username,
      name,
      password: hashedPassword,
    });

    await user.save();

    // Respond with success message
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};