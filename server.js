const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'https://movierecomendation-gilt.vercel.app',
  'http://localhost:3000',
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
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

// Validate TMDB API key
if (!TMDB_API_KEY) {
  console.warn('Warning: TMDB_API_KEY is not set. API requests will fail.');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Movie details route (unchanged from previous)
app.get('/movieDetails/:id', async (req, res, next) => {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured');
    }
    const { id } = req.params;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
      timeout: 10000,
    });

    const movie = response.data;
    res.json({
      id: movie.id || 0,
      title: movie.title || 'Unknown',
      banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
      poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
      tagline: movie.tagline || '',
      overview: movie.overview || '',
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      rating: movie.vote_average || 0,
      runtime: movie.runtime || 0,
      director: 'Unknown',
      genres: movie.genres ? movie.genres.map((g) => g.name) : [],
      cast: [],
      budget: movie.budget || 0,
      revenue: movie.revenue || 0,
      trailer: null,
    });
  } catch (error) {
    console.error('Error fetching movie details:', error.response?.data || error.message);
    next(error);
  }
});

// Trending movies route (modified from /movies)
app.get('/trending', async (req, res, next) => {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured');
    }
    console.log('Fetching trending movies from TMDB...');
    const movieRes = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
      },
      timeout: 10000,
    });

    const movies = movieRes.data.results || [];
    console.log('TMDB Response:', movies.length, 'movies fetched');

    const detailedMovies = await Promise.all(movies.slice(0, 30).map(async (movie) => {
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          axios.get(`${TMDB_BASE_URL}/movie/${movie.id}`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US' },
            timeout: 5000,
          }),
          axios.get(`${TMDB_BASE_URL}/movie/${movie.id}/credits`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US' },
            timeout: 5000,
          }),
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
        return {
          id: movie.id || 0,
          title: movie.title || 'Unknown',
          poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
          banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
          releaseYear: 'N/A',
          genres: [],
          rating: 0,
          director: 'Unknown',
          cast: [],
        };
      }
    }));

    res.json(detailedMovies);
  } catch (error) {
    console.error('TMDB Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    next(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
