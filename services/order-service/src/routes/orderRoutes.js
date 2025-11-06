const express = require('express');
const router = express.Router();
// Import the actual exported functions from the controller file
const { createOrder, getallOrders, getOrdersByUser } = require('../controllers/order.controller');

// Route to create a new order
router.post('/create', createOrder);

// Route to get all orders
router.get('/', getallOrders);

// Route to get orders by user
router.get('/user/:userId', getOrdersByUser);

module.exports = router;
