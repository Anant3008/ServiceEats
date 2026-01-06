const express = require('express');
const { validationResult } = require('express-validator');
const Payment = require('../models/payment.model');
const { produceEvent } = require('../kafka/producer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * CREATE PAYMENT - Initiates a Stripe PaymentIntent
 * POST /payments
 * Body: { orderId, userId, amount, currency, paymentMethod }
 * Returns: { paymentId, clientSecret, status }
 */
const createPayment = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { orderId, userId, amount, currency = 'inr', paymentMethod = 'card' } = req.body;

        // Check if payment already exists for this order (idempotency)
        const existingPayment = await Payment.findOne({ orderId });
        if (existingPayment && existingPayment.status !== 'failed' && existingPayment.status !== 'cancelled') {
            return res.status(400).json({
                error: 'Payment already exists for this order',
                paymentId: existingPayment._id,
                status: existingPayment.status,
            });
        }

        // Create Stripe PaymentIntent
        // Idempotency key prevents duplicate PaymentIntents if request is retried
        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: Math.round(amount * 100), // Convert to smallest currency unit (paise for INR)
                currency: currency.toLowerCase(),
                payment_method_types: getPaymentMethodTypes(paymentMethod),
                description: `Order payment for ${orderId}`,
                metadata: {
                    orderId,
                    userId,
                },
            },
            {
                idempotencyKey: `${orderId}-${userId}-${Date.now()}`, // Prevents duplicate charges
            }
        );

        // Save payment to database
        const payment = new Payment({
            orderId,
            userId,
            amount,
            currency,
            paymentMethod,
            provider: 'stripe',
            providerPaymentId: paymentIntent.id,
            status: 'processing', // PaymentIntent created, waiting for confirmation
            gatewayResponse: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                clientSecret: paymentIntent.client_secret,
            },
        });

        await payment.save();

        // Emit Kafka event - notify other services that payment is pending
        await produceEvent('payment.pending', {
            paymentId: payment._id.toString(),
            orderId,
            userId,
            amount,
            currency,
            paymentMethod,
            providerPaymentId: paymentIntent.id,
            status: 'processing',
            clientSecret: paymentIntent.client_secret,
        });

        console.log(`Payment initiated for order ${orderId}: ${paymentIntent.id}`);

        // Return clientSecret to frontend (frontend uses this to show card entry UI)
        res.status(201).json({
            paymentId: payment._id.toString(),
            orderId,
            clientSecret: paymentIntent.client_secret,
            providerPaymentId: paymentIntent.id,
            status: 'processing',
            message: 'Payment initiated. Use clientSecret to confirm payment on frontend.',
        });
    } catch (error) {
        console.error('Error creating payment:', error);

        // Stripe-specific errors
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.type === 'StripeAuthenticationError') {
            return res.status(401).json({ error: 'Stripe authentication failed. Check STRIPE_SECRET_KEY.' });
        }

        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

/**
 * GET ALL PAYMENTS - Retrieve all payment records (admin only later)
 */
const getallPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET PAYMENT BY ORDER ID - Get payment status for a specific order
 */
const getPaymentsByOrderId = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found for this order' });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error('Error fetching payment by order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * HELPER FUNCTION - Map payment method to Stripe types
 */
function getPaymentMethodTypes(paymentMethod) {
    const methodMap = {
        card: ['card'],
        upi: ['klarna'], // Stripe calls UPI as "klarna" or uses Netbanking
        wallet: ['alipay', 'wechat_pay'],
        cod: [], // COD is not handled by Stripe
    };

    return methodMap[paymentMethod] || ['card'];
}

module.exports = {
    createPayment,
    getallPayments,
    getPaymentsByOrderId,
};
