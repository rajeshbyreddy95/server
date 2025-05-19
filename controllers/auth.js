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
