const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movies');
const authController = require('../controllers/auth')


router.post('/signup', movieController.signUp)

// Base route to check if server is running
router.get('/', movieController.home);

// Fetch list of popular movies with details
router.get('/movies', movieController.movies);

// Get full details of a specific movie by ID
router.get('/movieDetails/:id', movieController.movieDetails);

// Fetch trending movies of the week
router.get('/trending', movieController.trending);

// Get cast/actor details by person ID
router.get('/cast/:id', movieController.cast);

router.get('/series',movieController.series)
router.get('/upcoming', movieController.upcoming)
router.get('/top-rated', movieController.toprated)
router.get('/genre/:genreId', movieController.genre)
router.get('/genres', movieController.genres)

module.exports = router;
