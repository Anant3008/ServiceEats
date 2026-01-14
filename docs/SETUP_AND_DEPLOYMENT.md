# ServiceEats Complete Setup & Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Docker Setup](#docker-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Full Stack](#running-the-full-stack)
5. [Testing the System](#testing-the-system)
6. [Troubleshooting](#troubleshooting)
7. [Deployment Guide](#deployment-guide)
8. [Monitoring & Logs](#monitoring--logs)

---

## Local Development Setup

### Prerequisites
```
✅ Node.js 18+ (LTS recommended)
✅ npm or yarn
✅ MongoDB (local or Atlas cloud)
✅ Docker & Docker Compose (for Kafka/Zookeeper)
✅ Git
✅ Stripe account (for payment integration)
✅ Google API key (optional, for AI trending messages)
```

### Step 1: Clone Repository
```bash
git clone https://github.com/Anant3008/ServiceEats.git
cd ServiceEats
```

### Step 2: Install Dependencies

#### Frontend
```bash
cd frontend
npm install
cd ..
```

#### Backend Services
```bash
# User Service
cd services/user-service
npm install
cd ../..

# Restaurant Service
cd services/restaurant-service
npm install
cd ../..

# Order Service
cd services/order-service
npm install
cd ../..

# Payment Service
cd services/payment-service
npm install
cd ../..

# Delivery Service
cd services/delivery-service
npm install
cd ../..

# Notification Service
cd services/notification-service
npm install
cd ../..

# Gateway
cd services/gateway
npm install
cd ../..
```

Or use a script:
```bash
#!/bin/bash
for dir in services/* frontend; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing $dir..."
    (cd "$dir" && npm install)
  fi
done
```

---

## Docker Setup

### What is Docker?
```
Traditional Setup:
❌ Install Node.js, MongoDB, Kafka on each developer's machine
❌ Version mismatches between machines
❌ "Works on my machine" problems
❌ Onboarding new developers is slow

Docker Setup:
✅ All services run in containers (isolated environments)
✅ Consistent versions across all machines
✅ No local installation needed
✅ Easy to scale and replicate
✅ Production-like environment locally
```

### Docker Compose Overview

**docker-compose.yaml Structure**:
```yaml
version: '3.9'

services:
  # Infrastructure
  zookeeper:         # Kafka dependency
  kafka:             # Message broker
  
  # Backend Services
  gateway-service:   # API Gateway
  user-service:      # Auth
  restaurant-service:# Restaurant data
  order-service:     # Orders & Cart
  payment-service:   # Payments
  delivery-service:  # Delivery tracking
  notification-service: # Notifications
```

### Building Docker Images

Each service has a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4001

CMD ["npm", "start"]
```

**What Each Line Does**:
```
FROM node:18-alpine
  └─ Start with Node.js 18 on Alpine Linux (small, fast)

WORKDIR /app
  └─ Set working directory inside container

COPY package*.json ./
  └─ Copy package.json and package-lock.json (if exists)

RUN npm install --production
  └─ Install only production dependencies (not dev)

COPY . .
  └─ Copy entire source code

EXPOSE 4001
  └─ Document that service listens on port 4001

CMD ["npm", "start"]
  └─ Default command to run (can be overridden)
```

---

## Environment Configuration

### What is `.env`?
```
Purpose: Store sensitive data and configuration
❌ DON'T commit to Git
✅ DO add to .gitignore
✅ DO document in .env.example

Structure:
KEY=VALUE
# Comments are allowed
DATABASE_URL=mongodb://localhost:27017/mydb
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Root Directory `.env`
```
# MongoDB URIs (one per service)
MONGO_URI_USER=mongodb://localhost:27017/service-eats-users
MONGO_URI_RESTAURANT=mongodb://localhost:27017/service-eats-restaurants
MONGO_URI_ORDER=mongodb://localhost:27017/service-eats-orders
MONGO_URI_PAYMENT=mongodb://localhost:27017/service-eats-payments
MONGO_URI_DELIVERY=mongodb://localhost:27017/service-eats-deliveries
MONGO_URI_NOTIFICATION=mongodb://localhost:27017/service-eats-notifications

# Kafka
KAFKA_BROKER=kafka:9092 (Docker), localhost:9092 (local)

# Services Ports
GATEWAY_PORT=3000
USER_SERVICE_PORT=4001
RESTAURANT_SERVICE_PORT=4002
ORDER_SERVICE_PORT=4003
DELIVERY_SERVICE_PORT=4004
PAYMENT_SERVICE_PORT=4005
NOTIFICATION_SERVICE_PORT=4006
FRONTEND_PORT=3001
```

### Service-Specific `.env` Files

#### services/user-service/.env
```
PORT=4001
MONGO_URI=mongodb://localhost:27017/service-eats-users
JWT_SECRET=your_super_secret_jwt_key_change_in_production_with_min_32_chars
KAFKA_BROKER=localhost:9092
NODE_ENV=development
```

**Why JWT_SECRET Important?**
```
JWT_SECRET is used to:
1. Sign JWT tokens (create signature)
2. Verify JWT tokens (validate signature)

If SECRET exposed:
❌ Attacker can create fake tokens
❌ Attacker can impersonate any user
❌ Complete authentication bypass

Protection:
✅ Store in .env (not in code)
✅ Use strong random string (32+ chars)
✅ Rotate regularly
✅ Different value for each environment
```

#### services/payment-service/.env
```
PORT=4005
MONGO_URI=mongodb://localhost:27017/service-eats-payments
KAFKA_BROKER=localhost:9092
STRIPE_SECRET_KEY=sk_test_51234567890abcdef_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef_your_webhook_secret
NODE_ENV=development
```

#### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_123456789
NEXT_PUBLIC_GOOGLE_AI_KEY=AIzaSyD_your_google_key
```

**Note**: `NEXT_PUBLIC_` prefix means variable is exposed to browser (safe for public keys)

---

## Running the Full Stack

### Option 1: Docker Compose (Recommended)
```bash
cd ServiceEats
docker-compose up -d
```

**What Happens**:
```
1. Builds images for all services (if not built)
2. Creates containers
3. Starts Zookeeper → Kafka (dependency chain)
4. Starts all microservices (after Kafka healthy)
5. All services connect to their MongoDB instances
```

**Verify Services Are Running**:
```bash
docker-compose ps

# Expected output:
NAME                 STATUS
zookeeper            Up
kafka                Up (healthy)
gateway-service      Up
user-service         Up
restaurant-service   Up
order-service        Up
payment-service      Up
delivery-service     Up
notification-service Up
```

**View Logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service

# Last 100 lines
docker-compose logs --tail=100 order-service

# Specific time range
docker-compose logs --since 2024-01-14T10:00:00
```

**Stop Services**:
```bash
docker-compose down              # Stop and remove containers
docker-compose down -v           # Also remove volumes (databases)
```

---

### Option 2: Local Development

#### Terminal 1: Start Kafka & Zookeeper
```bash
docker-compose up zookeeper kafka
```

#### Terminal 2: User Service
```bash
cd services/user-service
npm run dev
# Listening on http://localhost:4001
```

#### Terminal 3: Restaurant Service
```bash
cd services/restaurant-service
npm run dev
# Listening on http://localhost:4002
```

#### Terminal 4: Order Service
```bash
cd services/order-service
npm run dev
# Listening on http://localhost:4003
```

#### Terminal 5: Payment Service
```bash
cd services/payment-service
npm run dev
# Listening on http://localhost:4005
```

#### Terminal 6: Delivery Service
```bash
cd services/delivery-service
npm run dev
# Listening on http://localhost:4004
```

#### Terminal 7: Notification Service
```bash
cd services/notification-service
npm run dev
# Listening on http://localhost:4006
```

#### Terminal 8: Gateway
```bash
cd services/gateway
npm run dev
# Listening on http://localhost:3000
```

#### Terminal 9: Frontend
```bash
cd frontend
npm run dev
# Listening on http://localhost:3001
```

---

## Testing the System

### 1. Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Expected Response (201):
{
  "message": "User registered successfully"
}
```

### 2. Login User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Expected Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Add Restaurant

```bash
curl -X POST http://localhost:3000/api/restaurants/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace",
    "address": "123 Main Street, Pune",
    "cuisine": "Italian"
  }'

# Expected Response (201):
{
  "message": "Restaurant added successfully"
}
```

### 4. Get Restaurants

```bash
curl http://localhost:3000/api/restaurants

# Expected Response (200):
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Pizza Palace",
    "address": "123 Main Street, Pune",
    "cuisine": "Italian",
    "menu": [],
    "createdAt": "2024-01-14T10:30:00Z"
  }
]
```

### 5. Add to Cart

```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "restaurantId": "507f1f77bcf86cd799439011",
    "restaurantName": "Pizza Palace",
    "menuItemId": "507f1f77bcf86cd799439012",
    "name": "Margherita",
    "price": 250,
    "quantity": 2
  }'

# Expected Response (200):
{
  "_id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439014",
  "restaurantId": "507f1f77bcf86cd799439011",
  "restaurantName": "Pizza Palace",
  "items": [
    {
      "menuItemId": "507f1f77bcf86cd799439012",
      "name": "Margherita",
      "price": 250,
      "quantity": 2
    }
  ],
  "totalAmount": 500
}
```

### 6. Create Order

```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "restaurantId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "name": "Margherita",
        "price": 250,
        "quantity": 2
      }
    ]
  }'

# Expected Response (201):
{
  "_id": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439014",
  "restaurantId": "507f1f77bcf86cd799439011",
  "items": [...],
  "totalAmount": 500,
  "status": "created",
  "createdAt": "2024-01-14T10:35:00Z"
}
```

### 7. Get Orders

```bash
curl http://localhost:3000/api/orders/user/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (200):
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "userId": "507f1f77bcf86cd799439014",
      "restaurantId": "507f1f77bcf86cd799439011",
      "items": [...],
      "totalAmount": 500,
      "status": "created",
      "createdAt": "2024-01-14T10:35:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### 8. Browser Testing

Open http://localhost:3001 in browser:
```
1. Home page loads
2. Click "Login / Sign Up"
3. Register new account
4. Browse restaurants
5. Add items to cart
6. Proceed to checkout
7. View order history
```

---

## Troubleshooting

### Issue: Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions**:
```bash
# 1. Start MongoDB locally
mongod

# 2. Or use MongoDB Atlas (cloud)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# 3. Or start in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Issue: Kafka Connection Error
```
Error: Failed to connect to broker
```

**Solutions**:
```bash
# 1. Check Kafka is running
docker-compose ps kafka

# 2. Wait for Kafka to be healthy
docker-compose logs kafka
# Look for "INFO [KafkaServer id=1] started (kafka.server.KafkaServer)"

# 3. Check KAFKA_BROKER setting
# Should be "kafka:9092" in Docker
# Should be "localhost:9092" locally
```

### Issue: Frontend Can't Connect to Backend
```
CORS Error or Network Error
```

**Solutions**:
```bash
# 1. Check gateway is running
curl http://localhost:3000/health

# 2. Check services are running
curl http://localhost:4001/health (user service)
curl http://localhost:4003/health (order service)

# 3. Check NEXT_PUBLIC_API_URL in frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

# 4. Restart frontend
npm run dev
```

### Issue: JWT Token Errors
```
Error: jwt malformed or jwt expired
```

**Solutions**:
```bash
# 1. Check JWT_SECRET matches in all services
# Should be same across entire system

# 2. Check token format
# Should be: "Bearer eyJhbGc..."
# NOT: "eyJhbGc..." (missing Bearer prefix)

# 3. Check token expiry
# Tokens expire after 1 day
# User needs to login again
```

---

## Deployment Guide

### Deployment Checklist

#### Before Deployment
```
[ ] Code reviewed and tested
[ ] All .env files configured
[ ] Secrets stored securely (not in Git)
[ ] Database backed up
[ ] SSL certificates ready
[ ] Monitoring configured
[ ] Error logging configured
[ ] Rate limiting enabled
[ ] CORS properly configured
[ ] API documentation updated
```

#### Database Setup
```bash
# Use MongoDB Atlas (managed service)
# OR self-hosted with replication

# Create indices for performance
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.carts.createIndex({ userId: 1, status: 1 })
db.payments.createIndex({ orderId: 1 })
```

#### Docker Deployment

##### Build Production Images
```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build user-service

# Push to registry (e.g., Docker Hub)
docker tag user-service username/user-service:v1.0.0
docker push username/user-service:v1.0.0
```

##### Production docker-compose.yaml
```yaml
version: '3.9'

services:
  gateway:
    image: myregistry/gateway:v1.0.0
    restart: always
    environment:
      PORT: 3000
      KAFKA_BROKER: kafka:9092
    depends_on:
      kafka:
        condition: service_healthy
    networks:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ... other services

networks:
  backend:
    driver: bridge

volumes:
  kafka-data:
  mongodb-data:
```

### Kubernetes Deployment (Advanced)

```yaml
# user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: myregistry/user-service:v1.0.0
        ports:
        - containerPort: 4001
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongo-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4001
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Monitoring & Logs

### Log Levels
```
DEBUG: Detailed information (development only)
INFO: General information (normal operation)
WARN: Warning messages (something unexpected)
ERROR: Error messages (operation failed)
FATAL: Fatal errors (service crash)
```

### Structured Logging
```javascript
// Good logging practice
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  service: 'user-service',
  level: 'INFO',
  event: 'user_registered',
  userId: user._id,
  email: user.email,
  durationMs: 145
}));

// Output:
// {"timestamp":"2024-01-14T10:30:00Z","service":"user-service","level":"INFO","event":"user_registered","userId":"507f1f77bcf86cd799439010","email":"john@example.com","durationMs":145}
```

### Key Metrics to Monitor
```
1. Request Latency
   └─ How long requests take
   └─ Alert if > 1000ms

2. Error Rate
   └─ % of requests that fail
   └─ Alert if > 1%

3. Throughput
   └─ Requests per second
   └─ Track for capacity planning

4. Database Performance
   └─ Query time
   └─ Connection pool usage

5. Kafka Lag
   └─ Events processed vs published
   └─ Alert if lag increases

6. Service Health
   └─ HTTP health checks
   └─ Alert if unhealthy
```

### Health Check Implementation
```javascript
// In every service's index.js
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Monitoring tool checks periodically:
curl http://user-service:4001/health
// Response: { "status": "healthy", ... }
```

---

## Performance Optimization

### Caching Strategy
```javascript
// Cache restaurant list (changes infrequently)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let restaurantCache = null;
let cacheExpiry = null;

router.get('/restaurants', (req, res) => {
  if (restaurantCache && Date.now() < cacheExpiry) {
    return res.json(restaurantCache);
  }

  // Fetch from DB
  const restaurants = Restaurant.find();
  restaurantCache = restaurants;
  cacheExpiry = Date.now() + CACHE_TTL;
  
  res.json(restaurants);
});
```

### Database Indexing
```javascript
// In order.model.js
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ status: 1 });

// Speeds up queries:
// GET /api/orders/user/123 (10x faster)
// GET /api/orders?restaurant=456 (10x faster)
```

### Connection Pooling
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10, // Max 10 connections
  minPoolSize: 5,  // Always keep 5 connections
});
```

---

## Related Documentation
- [Architecture Overview](ARCHITECTURE.md)
- [API Endpoints](API_ENDPOINTS.md) (to be created)
- [Troubleshooting Guide](TROUBLESHOOTING.md) (to be created)
