const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth')


router.post('/signup', authController.signUp)
router.post('/login', authController.login)
router.get('/me', authController.me)

module.exports = router;