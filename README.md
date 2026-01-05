# ServiceEats: Microservices Food Delivery Platform

ServiceEats is a microservices-based food delivery application that mirrors a production-style architecture. Each business capability runs in its own service, communicating over REST through an API gateway and asynchronously through Kafka.

## Project Overview

The platform covers user authentication, restaurant management, cart and order flows, payments, delivery orchestration, and notifications. The frontend is built with Next.js and talks to backend services via the gateway.

## System Architecture

- Frontend (`/frontend`): Next.js, React, TypeScript UI for customers and restaurant owners.
- API Gateway (`/services/gateway`): Node.js/Express entry point that routes and secures requests.
- Microservices (`/services/*`): Independent Node.js/Express services backed by MongoDB.
- Messaging: Apache Kafka (with Zookeeper) for event-driven workflows.
- Infrastructure: Docker Compose to provision Kafka, Zookeeper, and all services; MongoDB connection strings provided via environment variables.

### Services and Ports

| Service                  | Path                           | Port | Purpose |
| ------------------------ | ------------------------------ | ---- | ------- |
| API Gateway              | `/services/gateway`            | 3000 | Routes client requests to downstream services. |
| User Service             | `/services/user-service`       | 4001 | Registration, login, profile, JWT issuance. |
| Restaurant Service       | `/services/restaurant-service` | 4002 | Restaurant profiles, menus, items. |
| Order Service            | `/services/order-service`      | 4003 | Cart, order placement, order lifecycle. |
| Delivery Service         | `/services/delivery-service`   | 4004 | Driver assignment and delivery status. |
| Payment Service          | `/services/payment-service`    | 4005 | Payment intents and order charge handling. |
| Notification Service     | `/services/notification-service` | 4006 | Email/SMS/push-style order notifications. |

## Technology Stack

- Frontend: Next.js, React, TypeScript, CSS Modules/PostCSS.
- Backend services: Node.js, Express.js, JWT-based auth, Mongoose for MongoDB.
- Messaging: Apache Kafka for inter-service events (e.g., order paid → delivery assignment).
- Data: MongoDB per service, URIs supplied through env vars.
- API gateway: Express with `http-proxy-middleware` pattern.
- Containerization: Docker and Docker Compose for local orchestration.

## Local Development

### Prerequisites

- Node.js 18+.
- Docker and Docker Compose.

### Install dependencies

```bash
git clone https://github.com/Anant3008/ServiceEats.git
cd ServiceEats

# Frontend
cd frontend && npm install && cd ..

# Each service
for service in services/*; do
  if [ -f "$service/package.json" ]; then
    (cd "$service" && npm install)
  fi
done
```

### Environment

Create `.env` files for the frontend and each service. Common variables:

- `MONGO_URI` for each service (e.g., `mongodb://localhost:27017/service-eats-users`).
- `KAFKA_BROKER=kafka:9092` when running via Docker; `localhost:9092` for local brokers.
- `JWT_SECRET` for user-service auth.
- `PORT` matching the table above if you override defaults.

### Run with Docker Compose

Start the full stack (Kafka, Zookeeper, gateway, and all services):

```bash
docker-compose up -d
```

Gateway will be available at http://localhost:3000; services are reachable on ports 4001–4006. If you run the frontend in dev mode on the same machine, use a different port (for example `npm run dev -- --port 3001`).

### Run services manually

```bash
# Example: user service
cd services/user-service
npm run dev

# Gateway
cd services/gateway
npm run dev

# Frontend
cd frontend
npm run dev -- --port 3001
```

## Contributing

Pull requests and issues are welcome. Please include clear reproduction steps or test coverage where relevant.
