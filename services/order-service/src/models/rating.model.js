const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'Order'
  },
  userId: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String,
    required: true
  },
  // Order rating (delivery experience, packaging, time)
  orderRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  orderReview: {
    type: String,
    default: '',
    maxlength: 500
  },
  // Restaurant rating (food quality, taste, value)
  restaurantRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  restaurantReview: {
    type: String,
    default: '',
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for faster queries
ratingSchema.index({ restaurantId: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
