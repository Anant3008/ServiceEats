const express = require('express');
const router = express.Router();
const { getallDeliveries , getDeliveriesByOrderId } = require('../controllers/delivery.controller');

router.get('/', getallDeliveries);
router.get('/:orderId', getDeliveriesByOrderId);

module.exports = router;