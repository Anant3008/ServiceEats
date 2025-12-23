const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
// Import the actual exported functions from the controller file
const { createOrder, getallOrders, getOrdersByUser, processPaymentFromCart, getOrderById } = require('../controllers/order.controller');

// Route to create a new order
router.post('/create', createOrder);

// Route to get all orders
router.get('/', getallOrders);

// Route to get orders by user
router.get('/user/:userId', getOrdersByUser);

// Get single order by ID (requires auth)
router.get('/:orderId', authenticateToken, getOrderById);

// Process payment and confirm order from user's active cart (requires auth)
router.post('/process-payment', authenticateToken, processPaymentFromCart);

module.exports = router;
