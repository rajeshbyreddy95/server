const jwt = require('jsonwebtoken');
const Favourite = require('../models/Favourite');
const User = require('../models/User');

// 🔄 Helper to decode JWT and fetch user
const getUserFromToken = async (authHeader) => {
  if (!authHeader) throw { status: 401, message: 'No token provided' };

  const token = authHeader.split(' ')[1];
  if (!token) throw { status: 401, message: 'Invalid Authorization header format' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) throw { status: 401, message: 'Invalid token structure' };

    const user = await User.findById(decoded.userId).select('email');
    if (!user) throw { status: 404, message: 'User not found' };

    return user;
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw { status: 401, message: 'Token expired' };
    if (err.name === 'JsonWebTokenError') throw { status: 401, message: 'Invalid token' };
    throw { status: 500, message: 'Token verification failed' };
  }
};

// ⭐ Add Favourite
exports.addFavourite = async (req, res) => {
  const { movieId } = req.body;

  try {
    const user = await getUserFromToken(req.headers.authorization);

    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    let favourite = await Favourite.findOne({ email: user.email });

    if (favourite) {
      if (favourite.movieIds.includes(movieId)) {
        return res.status(400).json({ message: 'Movie already in favourites' });
      }
      favourite.movieIds.push(movieId);
      await favourite.save();
    } else {
      favourite = new Favourite({ email: user.email, movieIds: [movieId] });
      await favourite.save();
    }

    res.status(201).json({ message: 'Movie added to favourites', movieId });
  } catch (error) {
    console.error('🔥 Add Favourite Error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// 📄 Get Favourites
exports.getFavourites = async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);

    const favourite = await Favourite.findOne({ email: user.email });
    res.status(200).json({ movieIds: favourite ? favourite.movieIds : [] });
  } catch (error) {
    console.error('🔥 Get Favourites Error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// ❌ Remove Favourite
exports.removeFavourite = async (req, res) => {
  const { movieId } = req.params;

  try {
    const user = await getUserFromToken(req.headers.authorization);

    const favourite = await Favourite.findOne({ email: user.email });
    if (!favourite || !favourite.movieIds.includes(movieId)) {
      return res.status(400).json({ message: 'Movie not in favourites' });
    }

    favourite.movieIds = favourite.movieIds.filter((id) => id !== movieId);
    await favourite.save();

    res.status(200).json({ message: 'Movie removed from favourites', movieId });
  } catch (error) {
    console.error('🔥 Remove Favourite Error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};
