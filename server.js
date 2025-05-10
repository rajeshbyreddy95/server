const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'https://movierecomendation-gilt.vercel.app',
  'http://localhost:3000', // Allow local development
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Validate TMDB API key
if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is not set. Please configure it in environment variables.');
  process.exit(1);
}

// Existing route for movie details (unchanged)
app.get('/movieDetails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
    });

    const movie = response.data;
    res.json({
      id: movie.id,
      title: movie.title,
      banner: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      tagline: movie.tagline,
      overview: movie.overview,
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      rating: movie.vote_average,
      runtime: movie.runtime,
      director: 'Unknown',
      genres: movie.genres.map((g) => g.name),
      cast: [],
      budget: movie.budget || 0,
      revenue: movie.revenue || 0,
      trailer: null,
    });
  } catch (error) {
    console.error('Error fetching movie details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch movie details', details: error.message });
  }
});

// Trending movies route
app.get('/trending', async (req, res) => {
  try {
    console.log('Fetching trending movies from TMDB...');
    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
      },
      timeout: 10000, // 10s timeout
    });

    console.log('TMDB Response:', response.data.results.length, 'movies fetched');
    const movies = response.data.results.slice(0, 30).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      genres: movie.genre_ids.map((id) => {
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
        return genreMap[id] || 'Unknown';
      }),
      rating: movie.vote_average,
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
    }));

    res.json(movies);
  } catch (error) {
    console.error('TMDB Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config?.url,
    });
    res.status(500).json({
      error: 'Failed to fetch trending movies',
      details: error.response?.data?.status_message || error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});