const Rating = require('../models/rating.model');
const Order = require('../models/order.model');
const axios = require('axios');

// Submit a new rating for an order
const submitRating = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { orderId, restaurantId, orderRating, orderReview, restaurantRating, restaurantReview } = req.body;

    // Validation: Check required fields
    if (!orderId || !restaurantId || !orderRating || !restaurantRating) {
      return res.status(400).json({
        message: 'orderId, restaurantId, orderRating, and restaurantRating are required'
      });
    }

    // Validation: Check rating values (1-5)
    if (orderRating < 1 || orderRating > 5 || restaurantRating < 1 || restaurantRating > 5) {
      return res.status(400).json({
        message: 'Ratings must be between 1 and 5'
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only rate your own orders' });
    }

    // Check if order is delivered
    // For testing, delivery status check is commented
    // In production, uncomment the following:
    /*
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'You can only rate orders that have been delivered',
        currentStatus: order.status
      });
    }
    */
    

    // Check if rating already exists
    const existingRating = await Rating.findOne({ orderId });
    if (existingRating) {
      return res.status(400).json({ 
        message: 'You have already rated this order',
        existingRating
      });
    }

    // Create new rating
    const rating = new Rating({
      orderId,
      userId,
      restaurantId,
      orderRating,
      orderReview: orderReview || '',
      restaurantRating,
      restaurantReview: restaurantReview || ''
    });

    await rating.save();

    // Update restaurant's average rating
    // Call restaurant service to update rating
    try {
      await updateRestaurantRating(restaurantId);
    } catch (error) {
      console.error('Failed to update restaurant rating:', error.message);
      // Don't fail the rating submission if restaurant update fails
    }

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get rating for a specific order
const getRatingByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const rating = await Rating.findOne({ orderId });

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found for this order' });
    }

    res.json(rating);
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all ratings for a restaurant (returns last 10 with only restaurant review data)
const getRatingsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Get last 10 ratings, sorted by newest first
    const ratings = await Rating.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate average restaurant rating only (orderRating is independent, for delivery analytics)
    const avgRestaurantRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.restaurantRating, 0) / ratings.length
      : 0;

    // Format response - show only restaurantRating and restaurantReview
    const reviews = ratings.map(r => ({
      userId: r.userId,
      rating: r.restaurantRating,
      review: r.restaurantReview,
      createdAt: r.createdAt
    }));

    res.json({
      averageRating: Math.round(avgRestaurantRating * 10) / 10, // Round to 1 decimal
      totalReviews: ratings.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching restaurant ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all ratings by a user (last 50, no pagination)
const getRatingsByUser = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const ratings = await Rating.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      totalRatings: ratings.length,
      ratings
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update restaurant's average rating
const updateRestaurantRating = async (restaurantId) => {
  try {
    // Calculate new average rating for the restaurant
    const ratings = await Rating.find({ restaurantId });
    
    if (ratings.length === 0) return;

    const avgRating = ratings.reduce((sum, r) => sum + r.restaurantRating, 0) / ratings.length;
    const roundedRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal

    // Call restaurant service to update rating
    // Using localhost in development; in production, use service name
    const restaurantServiceUrl = process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:4002';
    
    await axios.put(`${restaurantServiceUrl}/api/restaurants/${restaurantId}/rating`, {
      rating: roundedRating,
      totalRatings: ratings.length
    });

    console.log(`Updated restaurant ${restaurantId} rating to ${roundedRating}`);
  } catch (error) {
    console.error('Error updating restaurant rating:', error.message);
    throw error;
  }
};

module.exports = {
  submitRating,
  getRatingByOrderId,
  getRatingsByRestaurant,
  getRatingsByUser
};
