const express = require('express');
const Payment = require('../models/payment.model');

const getallPayments = async (req, res) => {
    try {
        const payments = await Payment.find();
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getPaymentsByOrderId = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const payments = await Payment.findOne({ orderId });
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments by order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getallPayments,
    getPaymentsByOrderId
};