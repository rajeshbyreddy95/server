const express = require('express');
const { addFavourite, getFavourites } = require('../controllers/Favourite');
const router = express.Router();

router.post('/', addFavourite);
router.get('/', getFavourites);

module.exports = router;