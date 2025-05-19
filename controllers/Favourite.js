const jwt = require('jsonwebtoken');
const Favourite = require('../models/Favourite');

exports.addFavourite = async (req, res) => {
  const { movieId } = req.body;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
      favourite = new Favourite({
        email: user.email,
        movieIds: [movieId],
      });
      await favourite.save();
    }

    res.status(201).json({ message: 'Movie added to favourites', movieId });
  } catch (error) {
    console.error('Add favourite error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFavourites = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const favourite = await Favourite.findOne({ email: user.email });
    if (!favourite) {
      return res.status(200).json({ movieIds: [] });
    }

    res.status(200).json({ movieIds: favourite.movieIds });
  } catch (error) {
    console.error('Get favourites error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};