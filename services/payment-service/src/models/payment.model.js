const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        orderId: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'inr',
        },
        paymentMethod: {
            type: String,
            enum: ['card', 'upi', 'wallet', 'cod', 'unknown'],
            default: 'card',
        },
        provider: {
            type: String,
            enum: ['stripe', 'razorpay', 'mock'],
            default: 'stripe',
        },
        providerPaymentId: {
            type: String,
            index: true,
        },
        providerCustomerId: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        failureReason: {
            type: String,
        },
        gatewayResponse: {
            type: Object,
        },
    },
    { timestamps: true }
);

// Compound index for querying user's payments by status
paymentSchema.index({ userId: 1, status: 1 });

// Unique index on providerPaymentId to prevent duplicates
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
