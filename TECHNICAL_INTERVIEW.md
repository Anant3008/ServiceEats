# ServiceEats: Technical Interview Breakdown

This document provides a structured, interview-ready technical breakdown of the ServiceEats project — a production-style microservices food delivery platform.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [System Architecture](#2-system-architecture)
3. [Technical Decisions](#3-technical-decisions)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [State Management (Frontend)](#5-state-management-frontend)
6. [Performance Considerations](#6-performance-considerations)
7. [Challenges Faced](#7-challenges-faced)
8. [Scalability Considerations](#8-scalability-considerations)
9. [Deployment](#9-deployment)
10. [Improvements](#10-improvements)

---

## 1. High-Level Overview

### What Problem Does It Solve?

ServiceEats solves the problem of connecting customers with local restaurants for online food ordering and delivery. It handles the complete order lifecycle:

- Customers browse restaurants and menus
- Add items to cart and place orders
- Pay securely via Stripe
- Receive delivery assignment and status notifications

The platform is also a learning/showcase project that demonstrates how to build a **production-grade microservices architecture** — separating concerns (user auth, restaurant management, orders, payments, delivery, notifications) into independent, scalable services that communicate via REST and Kafka.

### Who Is the Target User?

| User Type | Capabilities |
|-----------|-------------|
| **Customer** | Browse restaurants, manage cart, checkout, view order history |
| **Restaurant Owner** | Add restaurant profiles and menus (admin flow; full management UI is a planned enhancement) |
| **Delivery Driver** | Assigned automatically when payment succeeds (full driver app is a planned enhancement) |

### Core Features

- **User registration and login** with JWT-based authentication
- **Restaurant browsing** with search and category filtering
- **Cart management** — add, update, and remove items; enforces single-restaurant carts
- **Checkout with Stripe** using the PaymentIntent flow (PCI-compliant)
- **Order history** with server-side pagination
- **Event-driven workflows** — payment success triggers delivery assignment and user notification via Apache Kafka
- **Responsive UI** built with Next.js, React, TypeScript, and TailwindCSS

---

## 2. System Architecture

### Frontend Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Home (weather + AI trending message + CTA)
│   ├── auth/                 # Login & Register pages
│   ├── restaurants/          # Restaurant list + [id] detail page
│   ├── cart/                 # Cart management
│   ├── checkout/             # Stripe payment
│   ├── orders/               # Order history + [orderId] detail
│   └── api/                  # Next.js API routes (geo, weather, AI)
├── components/               # Reusable UI (Navbar, WeatherBanner, etc.)
├── context/AuthContext.tsx   # Global auth state
├── hooks/                    # useAuth, useRequireAuth, useOrders
├── utils/                    # paymentApi.ts, getTrendingMessage.ts
└── types/                    # TypeScript type definitions
```

The frontend is a **Next.js App Router** application. Server Components are used for data fetching on the home page (weather, AI message). Client Components handle interactive flows (cart, checkout, auth forms).

### Backend Structure

Seven independent Node.js/Express services, each with its own MongoDB database:

| Service | Port | Responsibility |
|---------|------|----------------|
| **API Gateway** | 3000 | Single entry point; proxies all requests to downstream services; applies rate limiting and CORS |
| **User Service** | 4001 | Registration, login, JWT issuance, password hashing |
| **Restaurant Service** | 4002 | Restaurant profiles, menu items |
| **Order Service** | 4003 | Cart management, order creation, order history with pagination |
| **Delivery Service** | 4004 | Driver assignment, delivery status tracking |
| **Payment Service** | 4005 | Stripe PaymentIntent creation, webhook handling, idempotency |
| **Notification Service** | 4006 | Kafka-driven notifications (email/SMS/in-app, currently stored to DB) |

All services follow the same internal pattern:

```
service/
└── src/
    ├── index.js            # Express server bootstrap
    ├── config/db.js        # Mongoose connection
    ├── controllers/        # Business logic
    ├── models/             # Mongoose schemas
    ├── routes/             # Express route definitions
    ├── middleware/         # Auth guards, validators
    └── kafka/              # Producers and consumers
```

### Database Design

Each service owns an isolated MongoDB database. There is no shared database or cross-service joins. References across services are done by ID only, resolved at the application layer.

| Service | Key Collections |
|---------|----------------|
| User Service | `users` (name, email, hashedPassword, role, timestamps) |
| Restaurant Service | `restaurants` (name, cuisine, address, menu items, rating) |
| Order Service | `carts` (userId, restaurantId, items, totalAmount), `orders` (userId, restaurantId, items, status, totalAmount) |
| Payment Service | `payments` (orderId, userId, amount, currency, stripePaymentIntentId, status, idempotencyKey) |
| Delivery Service | `deliveries` (orderId, driverId, status: assigned→delivered) |
| Notification Service | `notifications` (userId, type, message, read, timestamps) |

### Service Breakdown and Communication

**Synchronous (REST via API Gateway)**  
Used when the client needs an immediate response:
```
Frontend → API Gateway (port 3000) → Target Service → Response
```

**Asynchronous (Apache Kafka)**  
Used for event-driven workflows that don't require an immediate response:

```
order_created  →  Payment Service (initiates Stripe PaymentIntent)
payment.succeeded  →  Delivery Service (assigns driver)
delivery.assigned  →  Notification Service (creates notification)
delivery.completed →  Notification Service (creates completion notification)
user_created   →  Notification Service (welcome notification, future)
```

### Data Flow: Frontend to Backend (Order Placement Example)

```
1. User clicks "Place Order" (frontend checkout page)
         │
         ▼
2. POST /api/payments  (Frontend → API Gateway)
         │
         ▼
3. Payment Service creates Stripe PaymentIntent
   Returns { clientSecret } to frontend
         │
         ▼
4. Frontend calls stripe.confirmCardPayment(clientSecret, cardElement)
   Card details go directly to Stripe — never touch our servers
         │
         ▼
5. Stripe processes payment and fires webhook to Payment Service
         │  Kafka: payment.succeeded
         ▼
6. Delivery Service assigns driver, creates delivery record
         │  Kafka: delivery.assigned
         ▼
7. Notification Service stores notification for user
         │
         ▼
8. Frontend polls GET /api/orders/user/:userId to show updated order history
```

---

## 3. Technical Decisions

### Why This Stack Was Chosen

| Layer | Choice | Reason |
|-------|--------|--------|
| **Frontend** | Next.js + React + TypeScript | SSR/SSG capabilities, type safety, large ecosystem |
| **Styling** | TailwindCSS 4 | Utility-first, eliminates unused CSS, rapid development |
| **Backend** | Node.js + Express | Non-blocking I/O suits high-concurrency food ordering; team familiarity |
| **Database** | MongoDB (Mongoose) | Flexible schema for restaurant menus and cart items; easy horizontal scaling |
| **Messaging** | Apache Kafka (KafkaJS) | High-throughput, persistent, replayable event log; supports fan-out to multiple consumers |
| **Auth** | JWT (jsonwebtoken) | Stateless; scales without sticky sessions; compatible with microservices |
| **Payment** | Stripe PaymentIntent | PCI DSS compliance; client-side card handling via Stripe Elements |
| **Container** | Docker Compose | Reproducible local dev environment for all services + Kafka + Zookeeper |

### Trade-offs

| Decision | Trade-off |
|----------|-----------|
| **Microservices over monolith** | More operational complexity and latency (service hops) in exchange for independent scaling, deployment, and failure isolation |
| **MongoDB over PostgreSQL** | Schema flexibility and easier horizontal sharding vs. no ACID transactions spanning multiple collections |
| **Kafka over direct REST calls between services** | Eventual consistency and added infrastructure (Zookeeper) vs. loose coupling, fault tolerance, and replay capability |
| **JWT over sessions** | No server-side session store (scales easily) vs. no server-side token revocation without a denylist |
| **Context API over Redux** | Less boilerplate and no external dependency vs. less powerful for very large or deeply nested state trees |
| **localStorage for JWT** | Simple persistence across page reloads vs. vulnerable to XSS (HttpOnly cookies are more secure) |

### Why Not Alternative Approaches

**Why not a monolith?**  
A monolith works fine at small scale, but the project intentionally demonstrates production-style architecture. Independent failure domains, team autonomy, and per-service scaling are core learning goals.

**Why not GraphQL?**  
REST is sufficient for the current set of well-defined API contracts. GraphQL adds complexity (resolver chains, n+1 queries) that is not warranted at this scale.

**Why not Redis Streams instead of Kafka?**  
Kafka's consumer group model, message retention, and replay capability are better suited for durable event-driven workflows. Redis Streams would work but provides less operational observability.

**Why not RabbitMQ instead of Kafka?**  
Kafka is preferable for ordered, replayable event logs. RabbitMQ is better for task queues where messages are consumed once and deleted. The order-to-delivery event chain benefits from Kafka's durability.

---

## 4. Authentication & Authorization

### How Login Works

```
1. POST /api/auth/login  { email, password }
         │
         ▼
2. User Service looks up user by email in MongoDB
         │
         ▼
3. bcryptjs.compare(password, storedHash) — timing-safe comparison
         │
         ▼
4. JWT signed with JWT_SECRET:
   {
     "userId": "abc123",
     "email": "user@example.com",
     "role": "customer",
     "iat": <issued_at>,
     "exp": <issued_at + 1 day>
   }
         │
         ▼
5. Frontend receives { token }
   Decodes payload via atob(token.split('.')[1])
   Stores token + user object in localStorage
   Updates AuthContext state
         │
         ▼
6. All subsequent authenticated requests include:
   Authorization: Bearer <token>
```

### Token Handling

- **Storage**: `localStorage` on the client (survives page reload)
- **Expiry**: 1 day (`expiresIn: '1d'` in `jsonwebtoken`)
- **Transport**: `Authorization: Bearer <token>` header on every protected API call
- **Verification**: Each service's auth middleware calls `jwt.verify(token, JWT_SECRET)` and attaches `req.user` for downstream handlers
- **Persistence on reload**: `AuthContext` reads from `localStorage` on mount to restore session without re-login

### Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcryptjs with 10 salt rounds — never stores plain-text passwords |
| JWT signing | HS256 algorithm with `JWT_SECRET` env variable |
| Token expiry | 1-day expiry limits damage from leaked tokens |
| PCI compliance | Stripe Elements — card data never touches the application servers |
| Idempotency keys | Payment Service prevents duplicate Stripe charges on network retries |
| Rate limiting | API Gateway applies request rate limits to prevent abuse |
| CORS | API Gateway controls allowed origins |

**Known limitation**: JWT tokens stored in `localStorage` are accessible to JavaScript and therefore vulnerable to XSS attacks. A production hardening step would move tokens to HttpOnly, Secure, SameSite=Strict cookies.

---

## 5. State Management (Frontend)

### How Data Is Stored

The application uses **React Context API** for global state and component-local `useState` for page-level data.

**Global state (AuthContext)**:
```typescript
{
  user: { userId, email, role } | null,
  token: string | null,
  isLoading: boolean,
  login(email, password): Promise<void>,
  register(name, email, password): Promise<void>,
  logout(): void
}
```

- Persisted to `localStorage` so it survives hard refreshes
- Re-hydrated from `localStorage` on app mount
- Propagated to all child components via `useAuth()` hook

**Page-level state** (e.g., cart, orders): Managed with `useState` + `useEffect` for data fetching. Custom hooks (`useOrders`) encapsulate fetch logic and expose `{ orders, total, loading, error }`.

**Why Context API over Redux?**
- No boilerplate (no actions, reducers, or dispatch)
- Built into React — no additional dependency
- Sufficient for the current auth + user scope
- Faster to implement and easier to maintain at this scale

### How Loading and Error States Are Handled

Every data-fetching flow follows a consistent pattern:

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchData() {
    try {
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(res.statusText);
      setData(await res.json());
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [dependencies]);
```

- **Loading**: Spinner or skeleton screen while `loading === true`
- **Error**: Inline error message with retry action
- **Empty state**: Dedicated UI (e.g., "Your cart is empty → Continue Shopping")
- **Optimistic updates**: Quantity changes update local state immediately before the API confirms

---

## 6. Performance Considerations

### Caching

- **Next.js Server Components** on the home page cache weather and AI trending message data at build/request time using the built-in `fetch` cache.
- **API Gateway** is the natural place to add response caching (e.g., restaurant list) — not yet implemented but can be added with `node-cache` or Redis without changing downstream services.
- **MongoDB indexes**: Each service indexes frequently queried fields (e.g., `userId` on orders and carts, `email` on users) to keep query times sub-millisecond.

### Optimizations

- **Next.js Image component** automatically serves WebP, applies lazy loading, and prevents layout shift.
- **Code splitting**: Next.js automatically splits bundles per route; heavy components (e.g., Stripe `Elements`) are loaded only on the checkout page.
- **Memoization**: `React.memo` is applied to list item components (e.g., `CartItem`, `OrderCard`) to prevent unnecessary re-renders when parent state changes.
- **TailwindCSS PurgeCSS**: Unused CSS is eliminated at build time, keeping the CSS bundle small.

### Pagination / Lazy Loading

- Order history uses **server-side pagination**: `GET /api/orders/user/:userId?page=1&limit=10`. The backend returns `{ orders, total, page, limit }`, and the frontend renders a Previous/Next control.
- Restaurant list is fetched in full (typical catalog size is small). If the catalog grows, cursor-based pagination can be added to the restaurant service without frontend rework.

---

## 7. Challenges Faced

### Technical Issues

**Kafka connectivity at startup**  
Services start before Kafka is ready, causing connection errors. Solved with a `healthcheck` on the Kafka container in `docker-compose.yaml` and `depends_on: kafka: condition: service_healthy` for all services. Services also retry the Kafka connection on failure.

**Single-restaurant cart enforcement**  
If a user adds items from Restaurant A and then tries to add from Restaurant B, the cart must be cleared or the user must be warned. This validation logic lives in the Order Service and returns a `409 Conflict` that the frontend surfaces as a modal prompt.

**Stripe webhook verification**  
Stripe signs webhook payloads with `STRIPE_WEBHOOK_SECRET`. The raw request body must be passed to `stripe.webhooks.constructEvent()` before any JSON parsing. Express's `express.json()` middleware was applied globally and was consuming the raw body. Fixed by applying `express.raw()` specifically to the `/api/payments/webhooks/stripe` route.

**JWT decode on the frontend**  
The frontend needed to extract `userId` and `role` from the JWT payload without a backend round-trip. Solved by base64-decoding the payload segment: `JSON.parse(atob(token.split('.')[1]))`. This is safe because JWTs are signed (not encrypted) and the payload is intentionally readable.

### Debugging Problems

**Kafka event not reaching consumers**  
A topic name mismatch between producer (`order_created`) and consumer (`orderCreated`) silently dropped events. Discovered by adding consumer group lag monitoring via `kafka-consumer-groups.sh --describe`. Fixed by standardizing all topic names to snake_case.

**CORS errors during local development**  
Each service exposing its own CORS configuration meant inconsistent `Access-Control-Allow-Origin` headers. Centralised CORS to the API Gateway, which is the only origin the browser talks to.

### Architecture Problems

**Tight coupling in cart → order validation**  
The Order Service needs to validate menu items that live in the Restaurant Service. Initially this was a direct REST call from Order Service to Restaurant Service, creating a runtime dependency. This is acceptable for now but has been noted as a future refactor (see [Improvements](#10-improvements)).

---

## 8. Scalability Considerations

### What Happens If Users Increase 100×?

| Layer | Impact | Mitigation |
|-------|--------|-----------|
| **API Gateway** | Single point of entry becomes bottleneck | Horizontal scaling behind a load balancer (Nginx, AWS ALB); stateless, so any instance handles any request |
| **User / Order / Payment Services** | CPU and MongoDB I/O increase | Scale service containers independently (Kubernetes HPA); MongoDB Atlas auto-scaling |
| **Kafka** | Topic partition count limits consumer parallelism | Increase partition count per topic; add Kafka brokers; move to managed Confluent Cloud |
| **MongoDB** | Read-heavy restaurant queries slow down | Add read replicas; add Redis caching layer in front of restaurant service |
| **Frontend** | CDN absorbs static asset load; SSR origin scales independently | Deploy to Vercel / Cloudflare Pages for CDN; scale Next.js SSR on multiple instances |

### Bottlenecks

1. **Single Kafka broker** — zero replication factor means a broker failure halts all async workflows. Production requires at least 3 brokers with replication factor ≥ 2.
2. **No connection pooling** — each service opens a fresh MongoDB connection. At scale, a connection pool manager (e.g., `mongoose`'s built-in pool with `maxPoolSize`) is needed.
3. **Synchronous inter-service REST calls** — Order Service → Restaurant Service for menu validation adds latency and a runtime dependency. This should be replaced with event-sourcing or a read-model in the Order Service.
4. **localStorage JWT** — not a scalability issue per se, but token revocation (e.g., on password change) requires a server-side denylist, which adds state and complexity.

### Improvements Needed for Scale

- Add a **Redis cache** in the API Gateway for high-frequency read-only endpoints (restaurant list, menu).
- Replace direct service-to-service REST calls with an **event-sourced read model** to eliminate runtime coupling.
- Add **distributed tracing** (OpenTelemetry + Jaeger) to diagnose latency across service hops.
- Add a **circuit breaker** (e.g., `opossum`) in the API Gateway to prevent cascading failures.

---

## 9. Deployment

### Hosting

| Component | Local | Production Recommendation |
|-----------|-------|--------------------------|
| Frontend | `next dev` on port 3001 | Vercel (native Next.js) or Cloudflare Pages |
| Backend Services | Docker Compose | Kubernetes (EKS, GKE, or AKS) with one Deployment per service |
| MongoDB | External Atlas URI via env var | MongoDB Atlas (managed, auto-scaling, backups) |
| Kafka | Confluent image in Docker Compose | Confluent Cloud or AWS MSK |
| API Gateway | Docker Compose container | Kubernetes Deployment behind an Ingress Controller |

### CI/CD

The repository does not yet include a CI/CD pipeline. The recommended approach:

```
Pull Request opened
  └─ GitHub Actions workflow:
       ├── npm ci (all services + frontend)
       ├── npm run lint
       ├── npm test (unit + integration)
       └── docker build --no-cache (verify images build)

Merge to main
  └─ CD pipeline:
       ├── Build and push Docker images to registry (ECR / GHCR)
       ├── kubectl rollout update deployment/<service>
       └── Smoke tests against staging environment
```

### Environment Variables

Every service reads configuration from environment variables (`.env` files locally, Kubernetes Secrets / AWS SSM in production):

| Variable | Services | Purpose |
|----------|----------|---------|
| `PORT` | All services | Listening port |
| `MONGO_URI` | All backend services | MongoDB connection string (one per service) |
| `KAFKA_BROKER` | All backend services | `kafka:9092` (Docker) or managed broker address |
| `JWT_SECRET` | User Service, all auth middleware | Token signing/verification key |
| `STRIPE_SECRET_KEY` | Payment Service | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | Payment Service | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Frontend | Stripe publishable key |
| `NEXT_PUBLIC_API_URL` | Frontend | API Gateway base URL |
| `GOOGLE_AI_KEY` | Frontend (Next.js API route) | Google Generative AI for trending messages |

Never commit `.env` files. Use `.env.example` (already in repo) as a template.

---

## 10. Improvements

### What I Would Improve With More Time

#### Security
- Move JWT from `localStorage` to **HttpOnly, Secure, SameSite=Strict cookies** to eliminate XSS exposure.
- Add a **webhook idempotency guard** in the Payment Service so replayed Stripe webhook events (Stripe retries for up to 72 hours) do not double-update payment status or emit duplicate Kafka events.
- Add **refresh token rotation** to reduce the impact of a stolen access token.
- Add **input sanitisation** (e.g., `express-validator`) across all service routes.

#### Architecture
- Replace synchronous **Order Service → Restaurant Service** REST call with a **menu read-model** cached in the Order Service (populated via Kafka events when menus change). This eliminates runtime coupling.
- Add an **API Gateway circuit breaker** (`opossum`) to prevent cascading failures when a downstream service is unavailable.
- Introduce **distributed tracing** (OpenTelemetry + Jaeger) to track a request end-to-end across all service hops.

#### Features
- **Real-time order tracking**: Replace polling with WebSocket or Server-Sent Events so the order status page updates live.
- **Restaurant management UI**: A dashboard for restaurant owners to add/edit menus and view/manage incoming orders.
- **Driver app**: Authentication, live location broadcasting, and delivery acceptance flow for drivers.
- **Ratings and reviews**: Post-delivery order feedback stored in the Order Service.
- **Promotional codes**: Discount validation in the Order Service before Stripe PaymentIntent creation.

#### Testing
- **Unit tests** for service controllers and utility functions (Jest).
- **Integration tests** for the full order-to-payment-to-delivery Kafka event chain.
- **E2E tests** for critical user flows — registration, add-to-cart, checkout (Playwright or Cypress).

#### Operations
- **Centralised logging**: Ship logs from all containers to an ELK Stack or Grafana Loki for searchable, correlated logs.
- **Metrics**: Expose Prometheus metrics from each service and build Grafana dashboards for request rates, error rates, and latency.
- **Kubernetes**: Replace Docker Compose with Kubernetes manifests (Deployments, Services, HorizontalPodAutoscalers, ConfigMaps, Secrets) for production-grade orchestration.

---

*This document is intended as a concise reference for technical interview preparation. For deeper detail on individual services, refer to the [`docs/`](./docs/) directory.*
