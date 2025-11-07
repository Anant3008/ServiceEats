const express = require('express');
const router = express.Router();
// Import the actual exported functions from the controller file
const { getallPayments , getPaymentsByOrderId } = require('../controllers/payment.controller');

router.get('/', getallPayments);
router.get('/:orderId', getPaymentsByOrderId);

module.exports = router;