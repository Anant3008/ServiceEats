const express = require('express');
const router = express.Router();
const { createPayment, getallPayments, getPaymentsByOrderId } = require('../controllers/payment.controller');
const { handleStripeWebhook } = require('../controllers/webhook.controller');
const { validateCreatePayment, handleValidationErrors } = require('../middleware/validation');

// Webhook route (must be BEFORE bodyParser for raw body)
// This is registered in index.js with raw body middleware
router.post('/webhooks/stripe', handleStripeWebhook);

// POST /payments - Create a new payment (initiate Stripe PaymentIntent)
router.post('/', validateCreatePayment, handleValidationErrors, createPayment);

// GET /payments - Get all payments
router.get('/', getallPayments);

// GET /payments/:orderId - Get payment by order ID
router.get('/:orderId', getPaymentsByOrderId);

module.exports = router;