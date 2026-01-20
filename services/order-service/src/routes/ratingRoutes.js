const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  submitRating,
  getRatingByOrderId,
  getRatingsByRestaurant,
  getRatingsByUser
} = require('../controllers/rating.controller');

const router = express.Router();

// POST - Submit a new rating (protected)
router.post('/', authenticateToken, submitRating);

// GET - Get rating for a specific order
router.get('/order/:orderId', getRatingByOrderId);

// GET - Get all ratings for a restaurant
router.get('/restaurant/:restaurantId', getRatingsByRestaurant);

// GET - Get all ratings by current user (protected)
router.get('/user', authenticateToken, getRatingsByUser);

module.exports = router;

module.exports = router;
