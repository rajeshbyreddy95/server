const express = require('express');
const fav = require('../controllers/Favourite');
const router = express.Router();

router.post('/', fav.addFavourite);
router.get('/', fav.getFavourites);
router.delete('/:movieId', fav.removeFavourite);

module.exports = router;