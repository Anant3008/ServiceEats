const express = require('express');
const Delivery = require('../models/delivery.model');

const getallDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find();
        res.status(200).json(deliveries);
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getDeliveriesByOrderId = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const deliveries = await Delivery.findOne({ orderId });
        res.status(200).json(deliveries);
    } catch (error) {
        console.error('Error fetching deliveries by order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getallDeliveries, getDeliveriesByOrderId };