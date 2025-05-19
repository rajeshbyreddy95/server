const jwt = require('jsonwebtoken');
const Favourite = require('../models/Favourite');
const User = require('../models/User');


exports.addFavourite = async (req, res) => {
  const { movieId } = req.body;

  try {
    console.log('Incoming addFavourite request:', {
      headers: req.headers,
      body: req.body,
    });

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('🛡️ Token received:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('✅ Token decoded:', decoded);

    if (!decoded.userId) {
      console.log('❌ Decoded token missing userId:', decoded);
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    const user = await User.findById(decoded.userId).select('email');
    console.log('👤 Fetched user:', user);

    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(404).json({ message: 'User not found' });
    }

    if (!movieId) {
      console.log('❌ Movie ID missing in body');
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    let favourite = await Favourite.findOne({ email: user.email });
    console.log('⭐ Existing favourite entry:', favourite);

    if (favourite) {
      if (favourite.movieIds.includes(movieId)) {
        console.log('⚠️ Movie already in favourites:', movieId);
        return res.status(400).json({ message: 'Movie already in favourites' });
      }

      favourite.movieIds.push(movieId);
      await favourite.save();
      console.log('✅ Updated favourite with new movie:', favourite);
    } else {
      favourite = new Favourite({ email: user.email, movieIds: [movieId] });
      await favourite.save();
      console.log('✅ Created new favourite entry:', favourite);
    }

    res.status(201).json({ message: 'Movie added to favourites', movieId });

  } catch (error) {
    console.error('🔥 Add favourite error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      full: error,
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.getFavourites = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const favourite = await Favourite.findOne({ email: user.email });
    res.status(200).json({ movieIds: favourite ? favourite.movieIds : [] });
  } catch (error) {
    console.error('Get favourites error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

exports.removeFavourite = async (req, res) => {
  const { movieId } = req.params;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const favourite = await Favourite.findOne({ email: user.email });
    if (!favourite) return res.status(404).json({ message: 'No favourites found' });
    if (!favourite.movieIds.includes(movieId)) {
      return res.status(400).json({ message: 'Movie not in favourites' });
    }
    favourite.movieIds = favourite.movieIds.filter((id) => id !== movieId);
    await favourite.save();
    res.status(200).json({ message: 'Movie removed from favourites', movieId });
  } catch (error) {
    console.error('Remove favourite error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};