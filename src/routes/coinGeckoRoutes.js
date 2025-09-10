const express = require('express');
const router = express.Router();
const coinGeckoController = require('../controllers/coinGeckoController');

// Get token price
router.get('/price', coinGeckoController.getPrice);

// Search for coins
router.get('/search', coinGeckoController.searchCoins);

module.exports = router;
