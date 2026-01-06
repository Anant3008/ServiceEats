const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment.model');
const { produceEvent } = require('../kafka/producer');

/**
 * STRIPE WEBHOOK HANDLER
 * POST /webhooks/stripe
 * 
 * Handles Stripe webhook events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * 
 * Verifies Stripe signature and updates payment status
 */
const handleStripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        // Verify webhook signature
        // This ensures the request truly came from Stripe, not an attacker
        // req.body is the raw request body (Buffer) when using express.raw()
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        // Return 400 to Stripe so it knows signature is invalid and stops retrying
        return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'payment_intent.canceled':
                await handlePaymentCancelled(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Return 200 immediately so Stripe knows we received the webhook
        // (Don't wait for database/Kafka operations)
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Error processing webhook event:', err);
        // Return 500 so Stripe knows something went wrong and will retry
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * Handle payment_intent.succeeded event
 * Update payment status to 'succeeded' and emit Kafka event
 */
async function handlePaymentSucceeded(paymentIntent) {
    console.log(`Handling payment succeeded for: ${paymentIntent.id}`);

    try {
        // Find payment record by Stripe PaymentIntent ID
        const payment = await Payment.findOne({ providerPaymentId: paymentIntent.id });

        if (!payment) {
            console.warn(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
            // Log but don't fail - webhook might arrive before our POST /payments saves to DB
            return;
        }

        // Update payment status
        payment.status = 'succeeded';
        payment.gatewayResponse = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            charges: paymentIntent.charges?.data || [],
        };

        await payment.save();
        console.log(`Payment ${payment._id} marked as succeeded`);

        // Emit Kafka event - notify downstream services (delivery, notification)
        await produceEvent('payment.succeeded', {
            paymentId: payment._id.toString(),
            orderId: payment.orderId,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            providerPaymentId: paymentIntent.id,
            status: 'succeeded',
            chargeId: paymentIntent.charges?.data?.[0]?.id, // Stripe Charge ID
        });

        console.log(`Kafka event 'payment.succeeded' emitted for order ${payment.orderId}`);
    } catch (err) {
        console.error(`Error handling payment succeeded for ${paymentIntent.id}:`, err);
        throw err; // Re-throw so webhook endpoint returns 500 and Stripe retries
    }
}

/**
 * Handle payment_intent.payment_failed event
 * Update payment status to 'failed' and emit Kafka event with failure reason
 */
async function handlePaymentFailed(paymentIntent) {
    console.log(`Handling payment failed for: ${paymentIntent.id}`);

    try {
        // Find payment record by Stripe PaymentIntent ID
        const payment = await Payment.findOne({ providerPaymentId: paymentIntent.id });

        if (!payment) {
            console.warn(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
            return;
        }

        // Extract failure reason from last charge attempt
        let failureReason = 'unknown';
        if (paymentIntent.last_payment_error) {
            failureReason = paymentIntent.last_payment_error.message;
        }

        // Update payment status
        payment.status = 'failed';
        payment.failureReason = failureReason;
        payment.gatewayResponse = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            lastError: paymentIntent.last_payment_error,
        };

        await payment.save();
        console.log(`Payment ${payment._id} marked as failed: ${failureReason}`);

        // Emit Kafka event - notify downstream services
        await produceEvent('payment.failed', {
            paymentId: payment._id.toString(),
            orderId: payment.orderId,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            providerPaymentId: paymentIntent.id,
            status: 'failed',
            failureReason: failureReason,
        });

        console.log(`Kafka event 'payment.failed' emitted for order ${payment.orderId}`);
    } catch (err) {
        console.error(`Error handling payment failed for ${paymentIntent.id}:`, err);
        throw err;
    }
}

/**
 * Handle payment_intent.canceled event
 * Update payment status to 'cancelled'
 */
async function handlePaymentCancelled(paymentIntent) {
    console.log(`Handling payment cancelled for: ${paymentIntent.id}`);

    try {
        const payment = await Payment.findOne({ providerPaymentId: paymentIntent.id });

        if (!payment) {
            console.warn(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
            return;
        }

        payment.status = 'cancelled';
        payment.gatewayResponse = {
            id: paymentIntent.id,
            status: paymentIntent.status,
        };

        await payment.save();
        console.log(`Payment ${payment._id} marked as cancelled`);

        // Emit Kafka event
        await produceEvent('payment.cancelled', {
            paymentId: payment._id.toString(),
            orderId: payment.orderId,
            userId: payment.userId,
            providerPaymentId: paymentIntent.id,
            status: 'cancelled',
        });
    } catch (err) {
        console.error(`Error handling payment cancelled for ${paymentIntent.id}:`, err);
        throw err;
    }
}

module.exports = {
    handleStripeWebhook,
};
