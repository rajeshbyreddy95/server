const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';
const API_KEY = process.env.TMDB_API_KEY;
console.log(API_KEY);

if (!API_KEY) {
  throw new Error('TMDB_API_KEY is not configured');
}
exports.signUp = async(req, res)=>{
  const { email, username, name, password, confirmPassword } = req.body;

  try {
    // Input validation
    if (!email || !username || !name || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
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
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}