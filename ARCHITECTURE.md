# ServiceEats Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Microservices Architecture](#microservices-architecture)
5. [Communication Patterns](#communication-patterns)
6. [Data Flow](#data-flow)

---

## System Overview

### What We Are Building
ServiceEats is a **microservices-based food delivery platform** designed to mirror production-grade architecture. It separates concerns into independent services that communicate asynchronously through Kafka and synchronously through REST APIs via an API Gateway.

### Current State
- **7 Operational Backend Services** running on separate ports (4001-4006)
- **1 API Gateway** routing all client requests (port 3000)
- **Next.js Frontend** for customer-facing UI (port 3001)
- **Docker Compose** orchestration for local development
- **MongoDB** per service for data isolation
- **Apache Kafka** for event-driven communication

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Web)                          │
│                   Next.js Frontend (Port 3001)                   │
│                  React + TypeScript + TailwindCSS                │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────────┐
│                   API GATEWAY (Port 3000)                        │
│              Express.js + HTTP Proxy Middleware                  │
│  Routes: /api/auth, /api/restaurants, /api/orders, /api/payments
└────────────────────────┬────────────────────────────────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ User Service │ │Restaurant Srv│ │ Order Servic │ │Payment Srv   │
│ (Port 4001)  │ │ (Port 4002)  │ │ (Port 4003)  │ │ (Port 4005)  │
│              │ │              │ │              │ │              │
│ • Register   │ │ • Add Rest.  │ │ • Create Ord │ │ • Stripe API │
│ • Login      │ │ • Get Rest.  │ │ • Cart Mgmt  │ │ • Payment    │
│ • JWT Auth   │ │ • Menu Items │ │ • Order List │ │   Intent     │
│              │ │              │ │              │ │ • Webhooks   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       │  ┌─────────────┼────────────────┼────────────────┘
       │  │ MongoDB     │ MongoDB        │ MongoDB
       │  ▼             ▼                ▼
       └──────────────────────────────────────────┐
                                                  │
┌─────────────────────────────────────────────────▼──────────┐
│         Apache Kafka (Broker + Zookeeper)                   │
│  Events: order_created, payment.pending, delivery.assigned │
│         delivery.completed, user_created                    │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
       ┌─────────▼──────────┐  ┌────────▼─────────────┐
       │ Delivery Service   │  │ Notification Service │
       │ (Port 4004)        │  │ (Port 4006)          │
       │                    │  │                      │
       │ • Assign Driver    │  │ • Create Notifs      │
       │ • Track Delivery   │  │ • Send Emails/SMS    │
       │ • Update Status    │  │ • Store Notif Hist.  │
       │                    │  │                      │
       └────────┬───────────┘  └────────┬─────────────┘
                │                       │
                ▼ MongoDB               ▼ MongoDB
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1
- **UI Library**: React 19.2.0
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Icons**: Lucide React
- **Payment**: Stripe React SDK
- **State Management**: React Context API

### Backend Services
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password**: Bcrypt/Bcryptjs
- **Database**: MongoDB + Mongoose 8.19.2
- **Messaging**: Apache Kafka (KafkaJS 2.2.4)
- **Payment Gateway**: Stripe
- **Dev Tools**: Nodemon, Dotenv

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Message Broker**: Apache Kafka 7.5.0
- **Coordination**: Zookeeper (Kafka dependency)
- **Database**: MongoDB (per service)
- **API Communication**: REST + HTTP Proxy Middleware

---

## Microservices Architecture

### Service Independence
Each service:
- ✅ **Owns its database** (MongoDB instance)
- ✅ **Has independent business logic**
- ✅ **Exposes REST API endpoints**
- ✅ **Publishes/Consumes Kafka events**
- ✅ **Can be deployed separately**
- ✅ **Fails independently** (graceful degradation)

### Service Communication Pattern

```
Synchronous (REST):
Client → API Gateway → Downstream Service → Response

Asynchronous (Kafka Events):
Service A → Kafka Broker → Service B (Consumer)
           ↓
         Service C (Consumer)
         ↓
         Service D (Consumer)
```

---

## Communication Patterns

### 1. Synchronous Communication (REST)
**Used for**: Real-time data needs that require immediate response

**Examples**:
- Fetching restaurant list
- Getting user's cart
- Creating new order
- Checking payment status

**Benefits**:
- Immediate response
- Transaction consistency
- Simple to debug

**Drawbacks**:
- Tight coupling
- Cascading failures
- Higher latency with multiple calls

---

### 2. Asynchronous Communication (Kafka)
**Used for**: Events that trigger workflows and don't need immediate response

**Event Flow**:

```
EVENT: order_created
┌─────────────────────────────────────────┐
│ Order Service produces event:            │
│ {orderId, userId, items, totalAmount}   │
└────────────┬────────────────────────────┘
             │
             ▼ (Kafka Topic: order_created)
    ┌────────────────────┐
    │ Kafka Broker       │
    └────────────────────┘
             │
    ┌────────┴──────────┐
    ▼                   ▼
Payment Service    Notification Service
(Consumer)         (Consumer)
Initiates payment  Prepares email/SMS
```

**Benefits**:
- Loose coupling
- Fault tolerance (services don't depend on each other)
- Scalability (multiple consumers)
- Replay capability

**Drawbacks**:
- Eventual consistency (delays in propagation)
- Harder to debug
- More complex error handling

---

## Data Flow

### Complete User Journey: Order to Delivery

```
1. USER REGISTRATION
   ┌──────────────────────┐
   │ Frontend: Register   │
   └──────┬───────────────┘
          │
          ▼ POST /api/auth/register
   ┌──────────────────────┐
   │ User Service         │
   │ - Hash password      │
   │ - Save to DB         │
   │ - Produce event      │
   └──────┬───────────────┘
          │
          ▼ Kafka: user_created
   ┌──────────────────────┐
   │ Event logged for     │
   │ downstream services  │
   └──────────────────────┘


2. BROWSE RESTAURANTS
   ┌──────────────────────┐
   │ Frontend: Load page  │
   └──────┬───────────────┘
          │
          ▼ GET /api/restaurants
   ┌──────────────────────┐
   │ Restaurant Service   │
   │ - Query all records  │
   │ - Return with menu   │
   └──────┬───────────────┘
          │
          ▼ Response with list
   ┌──────────────────────┐
   │ Frontend: Display    │
   └──────────────────────┘


3. ADD TO CART & CHECKOUT
   ┌──────────────────────┐
   │ Frontend: Add items  │
   └──────┬───────────────┘
          │
          ▼ POST /api/cart/add
   ┌──────────────────────┐
   │ Order Service        │
   │ - Validate auth      │
   │ - Check restaurant   │
   │ - Add to cart        │
   └──────┬───────────────┘
          │
          ▼ Response: cart data
   ┌──────────────────────┐
   │ Frontend: Show cart  │
   └──────────────────────┘


4. PAYMENT PROCESSING
   ┌──────────────────────┐
   │ Frontend: Checkout   │
   └──────┬───────────────┘
          │
          ▼ POST /api/payments
   ┌──────────────────────┐
   │ Payment Service      │
   │ - Create Stripe      │
   │   PaymentIntent      │
   │ - Save to DB         │
   │ - Return clientSecret│
   └──────┬───────────────┘
          │
          ▼ Stripe API
   ┌──────────────────────┐
   │ Payment processed    │
   │ & webhook triggered  │
   └──────┬───────────────┘
          │
          ▼ Kafka: payment.succeeded
   ┌──────────────────────┐
   │ Delivery Service     │
   │ (consumer)           │
   │ - Assign driver      │
   │ - Create delivery    │
   │ - Send event         │
   └──────┬───────────────┘
          │
          ▼ Kafka: delivery.assigned
   ┌──────────────────────┐
   │ Notification Service │
   │ (consumer)           │
   │ - Create notification│
   │ - Prepare email      │
   └──────────────────────┘


5. DELIVERY & COMPLETION
   ┌──────────────────────┐
   │ Delivery Service     │
   │ - Updates status     │
   │   after 15s (demo)   │
   └──────┬───────────────┘
          │
          ▼ Kafka: delivery.completed
   ┌──────────────────────┐
   │ Notification Service │
   │ (consumer)           │
   │ - Creates completion │
   │   notification       │
   └──────────────────────┘
```

---

## Service Interaction Matrix

| Service A | Method | Service B | Purpose |
|-----------|--------|-----------|---------|
| Frontend | REST | Gateway | All requests routed through gateway |
| Gateway | REST | User Service | Auth endpoints |
| Gateway | REST | Restaurant Service | Browse restaurants |
| Gateway | REST | Order Service | Cart & order operations |
| Gateway | REST | Payment Service | Payment intents |
| Gateway | REST | Delivery Service | Delivery tracking |
| Order Service | REST | Restaurant Service (via Gateway) | Validate menu items |
| Payment Service | Kafka Subscribe | Order Service (producer) | Listen for order_created |
| Delivery Service | Kafka Subscribe | Payment Service (producer) | Listen for payment.succeeded |
| Notification Service | Kafka Subscribe | Delivery Service (producer) | Listen for delivery.completed |

---

## Why This Architecture?

### 1. **Scalability**
- Each service can scale independently based on load
- Payment service under heavy load doesn't affect restaurant service
- Kafka allows multiple consumers for the same event

### 2. **Resilience**
- Services fail independently
- Asynchronous events allow retry mechanisms
- API Gateway can have circuit breakers

### 3. **Development Velocity**
- Teams can work on services independently
- No shared code between services
- Reduces merge conflicts and integration issues

### 4. **Technology Flexibility**
- Each service can use different tech stack (currently all Node.js for consistency)
- Easy to swap implementations

### 5. **Operational Excellence**
- Docker Compose allows local development matching production
- Services can be monitored independently
- Logs from different services don't interfere

---

## Deployment Considerations

### Local Development
```bash
docker-compose up -d
# All services, Kafka, Zookeeper, databases start automatically
```

### Production (Not Covered in Current Docs)
- Would need orchestration (Kubernetes)
- Load balancing for API Gateway
- Managed database services (MongoDB Atlas)
- Managed Kafka (Confluent Cloud)
- Service monitoring (Prometheus, Grafana)
- Distributed tracing (Jaeger)
- Centralized logging (ELK Stack)

---

## Next Steps
See detailed service documentation:
- [User Service Documentation](./docs/services/USER_SERVICE.md)
- [Restaurant Service Documentation](./docs/services/RESTAURANT_SERVICE.md)
- [Order Service Documentation](./docs/services/ORDER_SERVICE.md)
- [Payment Service Documentation](./docs/services/PAYMENT_SERVICE.md)
- [Delivery Service Documentation](./docs/services/DELIVERY_SERVICE.md)
- [Notification Service Documentation](./docs/services/NOTIFICATION_SERVICE.md)
- [API Gateway Documentation](./docs/services/GATEWAY.md)
- [Frontend Documentation](./docs/FRONTEND.md)
