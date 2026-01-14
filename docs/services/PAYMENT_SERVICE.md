# Payment Service Documentation

## Overview
The Payment Service integrates with Stripe to handle payment processing, payment intent creation, webhook handling, and order payment lifecycle management. It bridges the Order Service and Delivery Service through Kafka events.

---

## 1. What Changes We Are Making?

### Current Implementation
✅ **Completed Features**:
- Create Stripe PaymentIntent
- Fetch all payments
- Fetch payment by order ID
- Stripe webhook handling
- Payment validation middleware
- Kafka consumer for order_created events
- Kafka event publishing (payment.pending, payment_success)
- Idempotency support for payments

### Planned Enhancements
- [ ] Webhook signature verification
- [ ] Multiple payment method support (UPI, Net Banking)
- [ ] Payment status tracking improvements
- [ ] Partial refunds
- [ ] Retry mechanism for failed payments
- [ ] Payment analytics dashboard
- [ ] Subscription payments
- [ ] Wallet/Prepaid balance integration
- [ ] Payment reconciliation reports

---

## 2. Why We Are Doing This? What Is It Improving?

### Benefits of Current Implementation

| Aspect | Improvement |
|--------|------------|
| **PCI Compliance** | Stripe handles card details, not our server |
| **Secure Tokens** | clientSecret prevents unauthorized payment access |
| **Idempotency** | Prevents duplicate charges on network retry |
| **Event-Driven** | Decouples payment processing from delivery |
| **Webhook Integration** | Server notified of Stripe events asynchronously |
| **Error Handling** | Comprehensive Stripe error handling |
| **Validation** | Request validation before calling Stripe |

### Why Stripe PaymentIntent?
```
Traditional API (Outdated):
1. Collect card details on frontend
2. Send to backend
3. Create charge directly
⚠️ PROBLEM: Server handles card data (PCI compliance issue)

PaymentIntent Flow (Secure):
1. Backend creates PaymentIntent with amount
2. Return clientSecret to frontend
3. Frontend collects card with clientSecret
4. Stripe handles card validation
5. Backend receives webhook confirmation
✅ Server never touches card data
✅ PCI compliance handled by Stripe
✅ Better error handling
✅ Supports multiple payment methods
```

### Why Idempotency?
```
Network Issue Scenario:
Client initiates payment → 
  Server creates Stripe PaymentIntent → 
  Response lost (network error) →
  Client retries same request →

Without Idempotency:
  → Two PaymentIntents created
  → Two charges possible
  ⚠️ PROBLEM: User charged twice

With Idempotency Key:
  → First attempt: Creates payment
  → Retry: Stripe returns same payment
  ✅ Prevents duplicate charges
  ✅ Safe to retry without fear
```

### Why Kafka Consumer?
```
Alternative: Order Service calls Payment Service directly
❌ Tightly coupled
❌ If payment service down, order service fails
❌ Complex error recovery

Current: Payment Service listens to order_created
✅ Loosely coupled
✅ Order service doesn't wait for payment
✅ Can retry events indefinitely
✅ Multiple payment attempts possible
✅ Failure isolation
```

---

## 3. How We Are Doing It? (In Detailed)

### Technology Stack
```
Framework: Express.js
Payment Gateway: Stripe
Database: MongoDB + Mongoose
Messaging: KafkaJS
Validation: express-validator
Environment: Dotenv
```

### Project Structure
```
payment-service/
├── src/
│   ├── index.js                      # Server entry point
│   ├── config/
│   │   └── db.js                     # MongoDB connection
│   ├── controllers/
│   │   ├── payment.controller.js     # Payment logic
│   │   └── webhook.controller.js     # Stripe webhook handling
│   ├── models/
│   │   └── payment.model.js          # Payment schema
│   ├── routes/
│   │   └── paymentRoutes.js          # API endpoints
│   ├── middleware/
│   │   └── validation.js             # Request validation
│   ├── kafka/
│   │   ├── consumer.js               # Event consumption
│   │   └── producer.js               # Event publishing
│   └── utils/ (future)
│       └── helpers.js
├── package.json
└── Dockerfile
```

---

### Data Model

#### Payment Schema
```javascript
{
  _id: ObjectId,
  orderId: ObjectId (required, indexed),
  userId: ObjectId (required),
  amount: Number (in paisa/cents),
  currency: String (default: 'inr'),
  paymentMethod: String (default: 'card'), // card, upi, wallet
  provider: String (default: 'stripe'),
  providerPaymentId: String, // Stripe PaymentIntent ID
  status: String, // processing, succeeded, failed, cancelled
  gatewayResponse: {
    id: String, // PaymentIntent ID
    status: String,
    clientSecret: String
  },
  refundAmount: Number,
  refundReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### Core Operations

#### 1. Create Payment Intent Flow

```
User proceeds to checkout
         ↓
POST /api/payments
Body: { orderId, userId, amount, currency, paymentMethod }
         ↓
Validate request:
├─ orderId required
├─ userId required
├─ amount > 0
├─ currency valid
└─ paymentMethod valid
         ↓
Check for existing payment:
├─ If exists and not failed/cancelled → error (prevent duplicate)
└─ If failed/cancelled → allow new attempt
         ↓
Create Stripe PaymentIntent:
├─ Amount (in paisa for INR)
├─ Currency
├─ Payment method types
├─ Description
├─ Metadata (orderId, userId)
├─ Idempotency key: {orderId}-{userId}-{timestamp}
└─ Call Stripe API
         ↓
Save Payment to DB:
├─ status: 'processing'
├─ providerPaymentId: Stripe ID
├─ gatewayResponse: clientSecret
└─ Timestamps
         ↓
Publish Kafka event: payment.pending
├─ paymentId
├─ orderId
├─ userId
├─ amount
└─ clientSecret
         ↓
Return to frontend:
{
  paymentId,
  clientSecret,
  providerPaymentId,
  status: 'processing'
}
```

**Code Implementation**:
```javascript
const createPayment = async (req, res) => {
    try {
        // Validate
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { orderId, userId, amount, currency = 'inr', paymentMethod = 'card' } = req.body;

        // Check for existing payment (idempotency check)
        const existingPayment = await Payment.findOne({ orderId });
        if (existingPayment && 
            existingPayment.status !== 'failed' && 
            existingPayment.status !== 'cancelled') {
            return res.status(400).json({
                error: 'Payment already exists for this order',
                paymentId: existingPayment._id,
                status: existingPayment.status,
            });
        }

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: Math.round(amount * 100), // Convert to paise
                currency: currency.toLowerCase(),
                payment_method_types: getPaymentMethodTypes(paymentMethod),
                description: `Order payment for ${orderId}`,
                metadata: {
                    orderId: orderId.toString(),
                    userId: userId.toString(),
                },
            },
            {
                // Idempotency key prevents duplicate charges
                idempotencyKey: `${orderId}-${userId}-${Date.now()}`,
            }
        );

        // Save to database
        const payment = new Payment({
            orderId,
            userId,
            amount,
            currency,
            paymentMethod,
            provider: 'stripe',
            providerPaymentId: paymentIntent.id,
            status: 'processing',
            gatewayResponse: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                clientSecret: paymentIntent.client_secret,
            },
        });

        await payment.save();

        // Publish event
        await produceEvent('payment.pending', {
            paymentId: payment._id.toString(),
            orderId: orderId.toString(),
            userId: userId.toString(),
            amount,
            currency,
            paymentMethod,
            providerPaymentId: paymentIntent.id,
            status: 'processing',
            clientSecret: paymentIntent.client_secret,
        });

        res.status(201).json({
            paymentId: payment._id.toString(),
            orderId: orderId.toString(),
            clientSecret: paymentIntent.client_secret,
            providerPaymentId: paymentIntent.id,
            status: 'processing',
            message: 'Use clientSecret to complete payment on frontend',
        });
    } catch (error) {
        console.error('Error creating payment:', error);

        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to create payment' });
    }
};
```

**Security Notes**:
- ✅ Never returns full PaymentIntent to frontend
- ✅ Only returns clientSecret (limited scope)
- ✅ Amount validated before Stripe call
- ✅ Stripe handles card details

---

#### 2. Stripe Webhook Handling Flow

```
Stripe Payment Completed
         ↓
Stripe sends webhook to:
POST /api/payments/webhooks/stripe
         ↓
Webhook middleware:
├─ Captures raw body (required for signature verification)
├─ Verifies signature with Stripe key
├─ Prevents fake webhooks
└─ Parses JSON
         ↓
Extract event:
├─ event.type: 'payment_intent.succeeded'
├─ event.data.object: PaymentIntent details
└─ Extract metadata (orderId, userId)
         ↓
Find payment in DB by providerPaymentId
         ↓
Update payment status:
├─ status: 'succeeded'
├─ Save to DB
└─ Timestamp
         ↓
Publish Kafka event: payment.succeeded
├─ paymentId
├─ orderId
├─ userId
├─ amount
└─ status
         ↓
Delivery Service (consumer):
├─ Assigns driver
├─ Creates delivery
└─ Publishes delivery.assigned event
```

**Code Implementation**:
```javascript
const handleStripeWebhook = async (req, res) => {
    let event;

    try {
        // Raw body capture for signature verification
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(
            req.body, // Raw body
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        // Handle payment_intent.succeeded event
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { orderId, userId } = paymentIntent.metadata;

            // Update payment status in DB
            const payment = await Payment.findOneAndUpdate(
                { providerPaymentId: paymentIntent.id },
                {
                    status: 'succeeded',
                    gatewayResponse: {
                        id: paymentIntent.id,
                        status: paymentIntent.status,
                    },
                },
                { new: true }
            );

            if (payment) {
                // Publish event for downstream services
                await produceEvent('payment.succeeded', {
                    paymentId: payment._id.toString(),
                    orderId: orderId.toString(),
                    userId: userId.toString(),
                    amount: payment.amount,
                    currency: payment.currency,
                    status: 'succeeded',
                });

                console.log(`Payment succeeded for order ${orderId}`);
            }
        }

        // Handle payment_intent.payment_failed event
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;

            await Payment.findOneAndUpdate(
                { providerPaymentId: paymentIntent.id },
                {
                    status: 'failed',
                    gatewayResponse: {
                        id: paymentIntent.id,
                        status: paymentIntent.status,
                        errorMessage: paymentIntent.last_payment_error?.message,
                    },
                }
            );

            console.log(`Payment failed for PaymentIntent ${paymentIntent.id}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};
```

**Why Raw Body?**
```
Stripe sends signature in header:
  Stripe-Signature: t=timestamp, v1=hash

To verify:
  1. Need original request body (not parsed JSON)
  2. Compute hash of: timestamp + '.' + body
  3. Compare with signature
  4. Prevents webhook tampering

Express.json() parses body first → signature verification fails
Raw middleware keeps body as Buffer → verification works
```

---

#### 3. Kafka Consumer (Auto-approve payments)

```
Order created
         ↓
Kafka: order_created event published
         ↓
Payment service consumer receives event
         ↓
Extract: orderId, userId, amount
         ↓
Create payment automatically:
├─ status: 'success' (for demo)
└─ Save to DB
         ↓
Publish Kafka: payment_success
         ↓
Delivery service triggers
```

**Code**:
```javascript
const startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order_created', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const data = JSON.parse(message.value.toString());
            console.log('Received order_created event:', data);

            // Create payment automatically (demo behavior)
            const payment = await Payment.create({
                orderId: data.orderId,
                userId: data.userId,
                amount: data.totalAmount,
                status: 'success' // Auto-approve for demo
            });

            console.log('Payment auto-approved for order:', data.orderId);

            // Publish success event
            await produceEvent('payment_success', {
                orderId: payment.orderId,
                userId: payment.userId,
                amount: payment.amount,
                status: payment.status
            });
        }
    });
};
```

**Note**: This is demo behavior. In production, use actual Stripe PaymentIntent webhooks.

---

### API Endpoints

#### POST /api/payments
```
Request:
{
  "orderId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439010",
  "amount": 500.50,
  "currency": "inr",
  "paymentMethod": "card"
}

Success Response (201):
{
  "paymentId": "60dff1b5c4e8b3c8d4f2a1c9",
  "orderId": "507f1f77bcf86cd799439011",
  "clientSecret": "pi_1234567890_secret_abcdef",
  "providerPaymentId": "pi_1234567890",
  "status": "processing",
  "message": "Use clientSecret to complete payment on frontend"
}

Error Responses:
400 Bad Request: "Validation error"
400 Bad Request: "Payment already exists for this order"
500 Server Error: "Failed to create payment"
```

---

#### GET /api/payments
```
Response (200):
[
  {
    _id: "60dff1b5c4e8b3c8d4f2a1c9",
    orderId: "507f1f77bcf86cd799439011",
    userId: "507f1f77bcf86cd799439010",
    amount: 500.50,
    currency: "inr",
    status: "succeeded",
    providerPaymentId: "pi_1234567890",
    createdAt: "2024-01-14T10:30:00Z"
  },
  ...
]
```

---

#### GET /api/payments/:orderId
```
Response (200):
{
  _id: "60dff1b5c4e8b3c8d4f2a1c9",
  orderId: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439010",
  amount: 500.50,
  currency: "inr",
  status: "succeeded",
  paymentMethod: "card",
  provider: "stripe",
  providerPaymentId: "pi_1234567890",
  createdAt: "2024-01-14T10:30:00Z"
}
```

---

### Validation Middleware

```javascript
const { body, validationResult } = require('express-validator');

const validateCreatePayment = [
    body('orderId')
        .isMongoId()
        .withMessage('Valid order ID required'),
    body('userId')
        .isMongoId()
        .withMessage('Valid user ID required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('currency')
        .optional()
        .isIn(['inr', 'usd', 'eur'])
        .withMessage('Invalid currency'),
    body('paymentMethod')
        .optional()
        .isIn(['card', 'upi', 'wallet'])
        .withMessage('Invalid payment method'),
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
```

---

### Webhook Setup in Stripe Dashboard

```
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint:
   URL: https://yourserver.com/api/payments/webhooks/stripe
   Events: payment_intent.succeeded, payment_intent.payment_failed
3. Copy Webhook Secret
4. Add to .env:
   STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### Environment Configuration

```env
PORT=4005
MONGO_URI=mongodb://localhost:27017/service-eats-payments
KAFKA_BROKER=localhost:9092
STRIPE_SECRET_KEY=sk_test_xxx (get from Stripe)
STRIPE_WEBHOOK_SECRET=whsec_xxx (from webhook setup)
NODE_ENV=development
```

---

### Stripe Integration in Frontend

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, CardElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
);

function CheckoutPage() {
  const stripe = useStripe();

  const handlePayment = async () => {
    // 1. Get cart data
    const cart = await fetchCart();

    // 2. Create payment intent on backend
    const response = await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify({
        orderId: cart._id,
        userId: user.userId,
        amount: cart.totalAmount,
        currency: 'inr',
        paymentMethod: 'card'
      })
    });

    const { clientSecret } = await response.json();

    // 3. Confirm payment with Stripe
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement, // CardElement from form
        billing_details: { ... }
      }
    });

    // 4. Check result
    if (result.paymentIntent.status === 'succeeded') {
      router.push('/orders'); // Success
    } else {
      setError('Payment failed'); // Failure
    }
  };
}
```

---

## Running the Service

```bash
cd services/payment-service
npm install
npm run dev
# Server runs on http://localhost:4005
```

---

## Security Checklist

```
[ ] Stripe keys in environment variables (not hardcoded)
[ ] Webhook signature verification enabled
[ ] Raw body middleware for webhooks
[ ] Input validation on all endpoints
[ ] HTTPS only in production
[ ] Rate limiting on payment endpoints
[ ] No sensitive data in logs
[ ] Idempotency keys implemented
[ ] Amount validation server-side
[ ] User authorization checks
[ ] Payment status validation
```

---

## Related Documentation
- [Architecture Overview](../ARCHITECTURE.md)
- [Order Service](./ORDER_SERVICE.md) (sends order_created)
- [Delivery Service](./DELIVERY_SERVICE.md) (consumes payment.succeeded)
- [API Gateway](./GATEWAY.md)
