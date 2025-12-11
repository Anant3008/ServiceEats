const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout
} = require('../controllers/cart.controller');

// All cart routes require authentication
router.use(authenticateToken);

// Get user's active cart
router.get('/', getCart);

// Add item to cart
router.post('/add', addToCart);

// Update item quantity
router.put('/update', updateCartItem);

// Remove item from cart
router.post('/remove', removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

// Checkout - convert cart to order
router.post('/checkout', checkout);

module.exports = router;
