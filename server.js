const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const API_KEY = process.env.TMDB_API_KEY;
const MONGODB_SRV = process.env.MONGODB_SRV;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

// CORS Middleware (Applied First)
app.use(cors({
  origin: ['https://movierecomendation-gilt.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.options('*', cors()); // Handle preflight requests

// Other Middleware
app.use(express.json());

// Make Mongoose connection available to routes
app.use((req, res, next) => {
  req.mongoose = mongoose;
  next();
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Mongoose Connection (Lazy Initialization)
let mongooseConnected = false;
async function connectMongoose() {
  if (mongooseConnected) return true;
  if (!MONGODB_SRV) {
    console.error('MONGODB_SRV is not configured');
    return false;
  }
  try {
    await mongoose.connect(MONGODB_SRV, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    mongooseConnected = true;
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
}

// User Schema for Signup
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Signup Route with bcrypt
app.post('/signup', async (req, res) => {
  const { email, username, name, password, confirmPassword } = req.body;

  try {
    const connected = await connectMongoose();
    if (!connected) {
      return res.status(503).json({ message: 'Database unavailable, please try again later' });
    }

    // Validation
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

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create and save user
    const user = new User({
      email,
      username,
      name,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to register user', details: error.message });
  }
});

// Root Route
app.get('/', async (req, res) => {
  res.send('Hello World from Node.js Server!');
});

// Movies Route
app.get('/movies', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }

    const movieRes = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`, {
      timeout: 10000,
    });
    const movies = movieRes.data.results || [];

    const detailedMovies = await Promise.all(movies.slice(0, 10).map(async (movie) => {
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          axios.get(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=en-US`, { timeout: 5000 }),
          axios.get(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}&language=en-US`, { timeout: 5000 }),
        ]);

        const details = detailsRes.data || {};
        const credits = creditsRes.data || {};

        const director = (credits.crew || []).find(member => member.job === 'Director');
        const topCast = (credits.cast || []).slice(0, 5).map(actor => ({
          name: actor.name || 'Unknown',
          profile: actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : null,
        }));

        return {
          id: movie.id || 0,
          title: movie.title || 'Unknown',
          poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
          banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
          releaseYear: details.release_date ? details.release_date.split('-')[0] : 'N/A',
          genres: (details.genres || []).map(g => g.name || 'Unknown'),
          rating: details.vote_average || 0,
          director: director ? director.name : 'Unknown',
          cast: topCast,
        };
      } catch (error) {
        console.error(`Error fetching details for movie ${movie.id}:`, error.message);
        return null;
      }
    }));

    res.json(detailedMovies.filter(movie => movie !== null));
  } catch (error) {
    console.error('Error fetching movies:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch movies', details: error.message });
  }
});

// Movie Details Route
app.get('/movieDetails/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }

    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`, { timeout: 5000 }),
      axios.get(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`, { timeout: 5000 }),
      axios.get(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`, { timeout: 5000 }),
    ]);

    const details = detailsRes.data || {};
    const credits = creditsRes.data || {};
    const videos = videosRes.data.results || [];

    const director = (credits.crew || []).find(member => member.job === 'Director');
    const cast = (credits.cast || []).slice(0, 10).map(actor => ({
      id: actor.id || 0,
      name: actor.name || 'Unknown',
      character: actor.character || 'Unknown',
      profile: actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : null,
    }));

    const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');

    const movieDetails = {
      id: details.id || 0,
      title: details.title || 'Unknown',
      overview: details.overview || '',
      poster: details.poster_path ? `${IMAGE_URL}${details.poster_path}` : null,
      banner: details.backdrop_path ? `${IMAGE_URL}${details.backdrop_path}` : null,
      releaseYear: details.release_date ? details.release_date.split('-')[0] : 'N/A',
      genres: (details.genres || []).map(g => g.name || 'Unknown'),
      rating: details.vote_average || 0,
      runtime: details.runtime || 0,
      director: director ? director.name : 'Unknown',
      cast,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      budget: details.budget || 0,
      revenue: details.revenue || 0,
      tagline: details.tagline || '',
    };

    res.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch movie details', details: error.message });
  }
});

// Trending Route
const genreMap = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const cache = { maxAge: 3600000 }; // 1-hour cache

app.get('/trending', async (req, res) => {
  console.log('Trending route accessed');
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }

    // Check cache
    if (cache.trending && Date.now() - cache.timestamp < cache.maxAge) {
      console.log('Serving cached trending movies');
      return res.json(cache.trending);
    }

    const response = await axios.get(`${BASE_URL}/trending/movie/week`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
        page: 1,
      },
      timeout: 10000,
    });

    const movies = (response.data.results || []).map((movie) => ({
      id: movie.id || 0,
      title: movie.title || 'Unknown',
      banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
      poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
      genres: (movie.genre_ids || []).map(id => genreMap[id] || 'Unknown'),
      rating: movie.vote_average || 0,
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
    }));

    // Cache the response
    cache.trending = movies;
    cache.timestamp = Date.now();

    res.json(movies);
  } catch (error) {
    console.error('TMDB fetch error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch trending movies', details: error.message });
  }
});

// Cast Details Route
app.get('/cast/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }

    const response = await axios.get(`${BASE_URL}/person/${id}`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
      },
      timeout: 5000,
    });

    const data = response.data || {};

    const castDetails = {
      id: data.id || 0,
      name: data.name || 'Unknown',
      biography: data.biography || null,
      birthday: data.birthday || null,
      deathday: data.deathday || null,
      gender: data.gender === 1 ? 'Female' : data.gender === 2 ? 'Male' : 'Other',
      knownFor: data.known_for_department || 'Acting',
      placeOfBirth: data.place_of_birth || null,
      popularity: data.popularity || 0,
      profile: data.profile_path ? `${IMAGE_URL}${data.profile_path}` : null,
      homepage: data.homepage || null,
    };

    res.json(castDetails);
  } catch (error) {
    console.error('Error fetching cast details:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch cast details', details: error.message });
  }
});

// Hello Route
app.get('/hello', (req, res) => {
  res.send('Hello Rajesh');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // For Vercel serverless functions