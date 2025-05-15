const express = require('express')
const router = express.Router()

const movieController = require('../controllers/movies')


router.get('/',movieController.home)
router.get('/movies', movieController.movies)
router.get('/movieDetails/:id', movieController.movieDetails)
router.get('/trending', movieController.trending)
router.get('/cast/:id', movieController.cast)

module.exports = router