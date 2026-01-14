# ServiceEats Quick Reference Guide

## 🚀 Quick Start

### Start Everything
```bash
docker-compose up -d
# All services, Kafka, Zookeeper, and databases start automatically
```

### Access Points
```
Frontend:      http://localhost:3001
API Gateway:   http://localhost:3000
User Service:  http://localhost:4001
Restaurant:    http://localhost:4002
Order Service: http://localhost:4003
Delivery:      http://localhost:4004
Payment:       http://localhost:4005
Notification:  http://localhost:4006
```

---

## 📋 Typical User Journey

```
1. Register/Login
   POST /api/auth/register
   POST /api/auth/login
   ↓ Get JWT token

2. Browse Restaurants
   GET /api/restaurants
   ↓ View list

3. Add to Cart
   POST /api/cart/add
   ↓ Item added

4. Create Order
   POST /api/orders/create
   ↓ Order created

5. Payment Processing
   POST /api/payments
   ↓ Stripe processes payment

6. Delivery Assignment
   Kafka: order_created → payment.succeeded → delivery.assigned
   ↓ Driver assigned

7. Order Complete
   Kafka: delivery.completed
   ↓ Notification sent
```

---

## 🔑 API Quick Reference

### Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'

# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'
# Response: {"token":"eyJhbGc..."}

# Use token in headers
TOKEN="eyJhbGc..."
```

### Restaurants
```bash
# List all
curl http://localhost:3000/api/restaurants

# Get one
curl http://localhost:3000/api/restaurants/{id}

# Add restaurant
curl -X POST http://localhost:3000/api/restaurants/add \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","address":"Main St","cuisine":"Italian"}'
```

### Cart (Requires Authentication)
```bash
# View cart
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# Add item
curl -X POST http://localhost:3000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId":"507f...",
    "menuItemId":"507f...",
    "name":"Pizza",
    "price":250,
    "quantity":1
  }'

# Update quantity
curl -X PUT http://localhost:3000/api/cart/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"menuItemId":"507f...","quantity":2}'

# Remove item
curl -X POST http://localhost:3000/api/cart/remove \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"menuItemId":"507f..."}'

# Clear cart
curl -X DELETE http://localhost:3000/api/cart/clear \
  -H "Authorization: Bearer $TOKEN"
```

### Orders (Requires Authentication)
```bash
# Create order
curl -X POST http://localhost:3000/api/orders/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId":"507f...",
    "items":[{"name":"Pizza","price":250,"quantity":1}]
  }'

# Get user's orders
curl http://localhost:3000/api/orders/user/{userId} \
  -H "Authorization: Bearer $TOKEN"

# Get single order
curl http://localhost:3000/api/orders/{orderId} \
  -H "Authorization: Bearer $TOKEN"

# Get all orders (paginated)
curl "http://localhost:3000/api/orders/user/123?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Payments
```bash
# Create payment intent
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"507f...",
    "userId":"507f...",
    "amount":500,
    "currency":"inr",
    "paymentMethod":"card"
  }'

# Get all payments
curl http://localhost:3000/api/payments

# Get payment by order
curl http://localhost:3000/api/payments/{orderId}
```

---

## 🗂️ Project Structure

```
ServiceEats/
├── frontend/                 # Next.js React app
│   ├── app/                 # Pages and routes
│   │   ├── page.tsx        # Home page
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── restaurants/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── orders/
│   ├── components/          # Reusable UI components
│   ├── context/            # React Context (Auth)
│   ├── hooks/              # Custom React hooks
│   └── package.json
│
├── services/
│   ├── gateway/            # API Gateway
│   ├── user-service/       # Auth (4001)
│   ├── restaurant-service/ # Restaurants (4002)
│   ├── order-service/      # Orders & Cart (4003)
│   ├── delivery-service/   # Delivery (4004)
│   ├── payment-service/    # Payments (4005)
│   └── notification-service/ # Notifications (4006)
│
├── docs/                   # Documentation (NEW!)
│   ├── README.md          # Index
│   ├── ARCHITECTURE.md
│   ├── FRONTEND.md
│   ├── SETUP_AND_DEPLOYMENT.md
│   └── services/
│       ├── USER_SERVICE.md
│       ├── ORDER_SERVICE.md
│       ├── PAYMENT_SERVICE.md
│       └── ...
│
├── docker-compose.yaml     # Orchestration
├── ARCHITECTURE.md         # System design
└── README.md              # Project overview
```

---

## 📊 Database Collections

### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: "customer"),
  createdAt: Date
}
```

### Restaurants
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  cuisine: String,
  menu: [{
    name: String,
    price: Number,
    isAvailable: Boolean
  }],
  createdAt: Date
}
```

### Orders
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  restaurantId: ObjectId,
  items: [{ name, price, quantity }],
  totalAmount: Number,
  status: String (default: "created"),
  createdAt: Date
}
```

### Carts
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  restaurantId: ObjectId,
  items: [{ menuItemId, name, price, quantity }],
  totalAmount: Number,
  status: String (default: "active"),
  createdAt: Date
}
```

### Payments
```javascript
{
  _id: ObjectId,
  orderId: ObjectId (indexed),
  userId: ObjectId,
  amount: Number,
  currency: String,
  status: String,
  providerPaymentId: String (Stripe),
  createdAt: Date
}
```

### Deliveries
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  driverName: String,
  status: String (assigned → delivered),
  location: { latitude, longitude },
  createdAt: Date
}
```

### Notifications
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  orderId: ObjectId,
  message: String,
  createdAt: Date
}
```

---

## 🔑 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_GOOGLE_AI_KEY=AIzaSyD_xxx
```

### User Service (.env)
```
PORT=4001
MONGO_URI=mongodb://localhost:27017/service-eats-users
JWT_SECRET=your_secret_key_min_32_chars
KAFKA_BROKER=localhost:9092
```

### Payment Service (.env)
```
PORT=4005
MONGO_URI=mongodb://localhost:27017/service-eats-payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
KAFKA_BROKER=localhost:9092
```

### Order Service (.env)
```
PORT=4003
MONGO_URI=mongodb://localhost:27017/service-eats-orders
KAFKA_BROKER=localhost:9092
```

---

## 🧪 Testing

### Manual API Testing
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Test login (get token)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | jq -r '.token')

# Test protected endpoint
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

### Browser Testing
1. Open http://localhost:3001
2. Register new account
3. Browse restaurants
4. Add items to cart
5. Proceed to checkout
6. View order history

---

## 🐛 Troubleshooting

### Service Not Starting
```bash
# Check logs
docker-compose logs service-name

# Check if port in use
lsof -i :3000

# Restart service
docker-compose restart service-name
```

### MongoDB Connection Failed
```bash
# Verify MongoDB is running
mongod --version

# Check connection string
MONGO_URI=mongodb://localhost:27017/db-name

# Use MongoDB Atlas (cloud)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db-name
```

### Kafka Not Connecting
```bash
# Verify Kafka is healthy
docker-compose logs kafka

# Should show: "INFO [KafkaServer id=1] started"

# Check broker address
KAFKA_BROKER=localhost:9092  # Local
KAFKA_BROKER=kafka:9092      # Docker
```

### JWT Token Issues
```bash
# Check token format (should have 3 parts: header.payload.signature)
echo $TOKEN | grep -o '\.' | wc -l  # Should output: 2

# Verify JWT_SECRET is same across all services
# All services should use same JWT_SECRET
```

---

## 📈 Kafka Events

### Event Topics and Flow
```
User Registration:
  user_created → [Order Service, Analytics]

Order Created:
  order_created → Payment Service, Notification Service

Payment Succeeded:
  payment.succeeded → Delivery Service, Notification Service

Delivery Assigned:
  delivery.assigned → Notification Service

Delivery Completed:
  delivery.completed → Notification Service
```

### Consuming Events (Example)
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'service-name',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'service-group' });

await consumer.connect();
await consumer.subscribe({ topic: 'order_created', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log('Event received:', data);
    // Process event
  }
});
```

---

## 🔐 Security Checklist

### Development
```
[ ] .env files created (not committed)
[ ] JWT_SECRET is strong (32+ chars)
[ ] STRIPE_SECRET_KEY is valid
[ ] CORS configured for localhost
[ ] All passwords hashed with bcryptjs
```

### Production
```
[ ] HTTPS enabled
[ ] Environment variables in secrets manager
[ ] JWT tokens have expiry
[ ] Rate limiting enabled
[ ] Input validation everywhere
[ ] SQL/NoSQL injection prevented
[ ] CORS whitelist configured
[ ] Health checks set up
[ ] Monitoring enabled
[ ] Backups scheduled
```

---

## 📚 Key Documentation Links

**Understanding the System:**
- [Full Architecture](ARCHITECTURE.md)
- [Frontend Implementation](docs/FRONTEND.md)
- [Complete Setup Guide](docs/SETUP_AND_DEPLOYMENT.md)

**Service Guides:**
- [User Service](docs/services/USER_SERVICE.md)
- [Order Service](docs/services/ORDER_SERVICE.md)
- [Payment Service](docs/services/PAYMENT_SERVICE.md)

**Quick Navigation:**
- [Documentation Index](docs/README.md)
- [Feature Status](docs/README.md#-feature-completion-status)

---

## 💡 Common Tasks

### Add New API Endpoint
1. Add route in service
2. Add controller logic
3. Update service documentation
4. Add curl testing example
5. Update FRONTEND.md if frontend needed

### Deploy to Production
1. Check [SETUP_AND_DEPLOYMENT.md](docs/SETUP_AND_DEPLOYMENT.md)
2. Configure environment variables
3. Build Docker images
4. Set up Kubernetes or Docker Swarm
5. Configure monitoring

### Debug Service Issue
1. Check logs: `docker-compose logs service-name`
2. Test health endpoint: `curl http://localhost:port/health`
3. Verify environment variables
4. Check database connection
5. Review recent code changes

### Run Full User Journey Test
1. Register user (POST /api/auth/register)
2. Login (POST /api/auth/login)
3. List restaurants (GET /api/restaurants)
4. Add to cart (POST /api/cart/add)
5. Create order (POST /api/orders/create)
6. Check payment (GET /api/payments)
7. View order history (GET /api/orders/user/:userId)

---

## ⚡ Performance Tips

### Database
- Add indexes on frequently queried fields
- Use pagination for large result sets
- Connection pooling for reuse

### Caching
- Cache restaurant list (changes infrequently)
- Cache user data (changes on login)
- Set appropriate TTLs

### API
- Use compression (gzip)
- Implement rate limiting
- Add request timeouts
- Use connection pooling

---

## 📞 Getting Help

1. **Check logs**: `docker-compose logs service-name`
2. **Check docs**: [docs/README.md](docs/README.md)
3. **Test endpoint**: `curl http://localhost:port/health`
4. **Check error in troubleshooting**: [See Troubleshooting](#-troubleshooting)
5. **Read service docs**: [Available in docs/services/](docs/services/)

---

## 🗂️ File Reference

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design |
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend guide |
| [docs/SETUP_AND_DEPLOYMENT.md](docs/SETUP_AND_DEPLOYMENT.md) | Setup guide |
| [docs/services/USER_SERVICE.md](docs/services/USER_SERVICE.md) | Auth service |
| [docs/services/ORDER_SERVICE.md](docs/services/ORDER_SERVICE.md) | Order service |
| [docs/services/PAYMENT_SERVICE.md](docs/services/PAYMENT_SERVICE.md) | Payment service |
| [docker-compose.yaml](docker-compose.yaml) | Docker setup |

---

**Last Updated**: January 14, 2024  
**Status**: Ready to Use ✅
