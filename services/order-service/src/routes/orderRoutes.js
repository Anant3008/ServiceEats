const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
// Import the actual exported functions from the controller file
const { createOrder, getallOrders, getOrdersByUser, getOrderById } = require('../controllers/order.controller');

// Route to create a new order (requires auth to extract userId from token)
router.post('/create', authenticateToken, createOrder);

// Route to get all orders
router.get('/', getallOrders);

// Route to get orders by user (requires auth)
router.get('/user/:userId', authenticateToken, getOrdersByUser);

// Get single order by ID (requires auth)
router.get('/:orderId', authenticateToken, getOrderById);

module.exports = router;
