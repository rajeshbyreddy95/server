const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();

const axios = require('axios');

const API_KEY = process.env.TMDB_API_KEY;

app.use(cors({
  origin: 'http://localhost:3000',
}));

app.get('/', async (req, res) => {
  res.send('Hello World from Node.js Server!');
});

app.get('/movies', async (req, res) => {
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

  try {
    const movieRes = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
    const movies = movieRes.data.results;

    const detailedMovies = await Promise.all(movies.slice(0, 100).map(async (movie) => {
      const [detailsRes, creditsRes] = await Promise.all([
        axios.get(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=en-US`),
        axios.get(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}&language=en-US`)
      ]);

      const details = detailsRes.data;
      const credits = creditsRes.data;

      const director = credits.crew.find(member => member.job === 'Director');
      const topCast = credits.cast.slice(0, 5).map(actor => ({
        name: actor.name,
        profile: actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : null
      }));

      return {
        id: movie.id,
        title: movie.title,
        poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
        banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
        releaseYear: details.release_date.split('-')[0],
        genres: details.genres.map(g => g.name),
        rating: details.vote_average,
        director: director ? director.name : 'Unknown',
        cast: topCast
      };
    }));

    res.json(detailedMovies);

  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

app.get('/movieDetails/:id', async (req, res) => {
  const { id } = req.params;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

  try {
    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`),
      axios.get(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`),
      axios.get(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`)
    ]);

    const details = detailsRes.data;
    const credits = creditsRes.data;
    const videos = videosRes.data.results;

    const director = credits.crew.find(member => member.job === 'Director');
    const cast = credits.cast.slice(0, 10).map(actor => ({
      name: actor.name,
      character: actor.character,
      profile: actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : null
    }));

    const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');

    const movieDetails = {
      id: details.id,
      title: details.title,
      overview: details.overview,
      poster: details.poster_path ? `${IMAGE_URL}${details.poster_path}` : null,
      banner: details.backdrop_path ? `${IMAGE_URL}${details.backdrop_path}` : null,
      releaseYear: details.release_date.split('-')[0],
      genres: details.genres.map(g => g.name),
      rating: details.vote_average,
      runtime: details.runtime,
      director: director ? director.name : 'Unknown',
      cast,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      budget: details.budget,
      revenue: details.revenue,
      tagline: details.tagline
    };

    res.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error.message);
    res.status(500).json({ message: 'Failed to fetch movie details' });
  }
});



// trending movie route
app.get('/trending', async (req, res, next) => {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured');
    }
    console.log('Fetching trending movies from TMDB...');
    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
      },
      timeout: 10000,
    });

    console.log('TMDB Response:', response.data.results?.length || 0, 'movies fetched');
    const movies = (response.data.results || []).slice(0, 30).map((movie) => ({
      id: movie.id || 0,
      title: movie.title || 'Unknown',
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      genres: (movie.genre_ids || []).map((id) => {
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
      rating: movie.vote_average || 0,
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
    }));

    res.json(movies);
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

app.get('/hello', (req, res) => {
  res.send('Hello Rajesh');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});