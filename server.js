const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const { route } = require('./routes/movies');
require('dotenv').config();
const axios = require('axios');


const movieRoutes = require('./routes/movies')

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  throw new Error('TMDB_API_KEY not found. Check your .env file.');
}
const BASE_URL = 'https://api.themoviedb.org/3';


app.use(cors());

app.use(express.json())

app.use('/', movieRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.error('Full error:', error);
