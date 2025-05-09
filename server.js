const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors')
require('dotenv').config();

const axios = require('axios');

const API_KEY = process.env.TMDB_API_KEY;


// cors
app.use(cors())

app.use(cors({
  origin: 'http://localhost:3000',
}));

app.get('/', async(req, res) => {
  res.send('Hello World from Node.js Server!');
});

app.get('/movies',async(req,res)=>{
    const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_URL = 'https://image.tmdb.org/t/p/original'; // For full resolution

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
})


app.get('/hello', (req, res) => {
  res.send('Hello Rajesh');
});



// Add more routes here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
