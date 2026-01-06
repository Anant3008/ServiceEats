const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const { startConsumer } = require('./kafka/consumer');

const app = express();

// Middleware to capture raw body for Stripe webhook signature verification
// This MUST come before express.json() and be used only for webhook routes
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json());

// Routes
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Payment service is running' });
});

const startServer = async () => {
    try {
        await connectDB();

        app.listen(process.env.PORT || 4005, () => {
            console.log(`Payment Service running on port ${process.env.PORT || 4005}`);
        });

        startConsumer();
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
