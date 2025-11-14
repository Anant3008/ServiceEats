# ServiceEats: A Microservices-Based Food Delivery Platform

Welcome to **ServiceEats**, a modern food delivery application built with a microservices architecture. This project demonstrates a decoupled, scalable, and resilient system where each core functionality of the business is handled by an independent service.

## 🚀 Project Overview

ServiceEats is designed to simulate a real-world food delivery platform. It includes services for user authentication, restaurant management, order processing, payment handling, delivery logistics, and notifications. The frontend is a Next.js application that communicates with the backend services through an API Gateway.

## 🏛️ System Architecture

The application is composed of several microservices that communicate with each other asynchronously via a Kafka message broker and synchronously via REST APIs through a central gateway.

### Core Components:

1.  **Frontend (`/frontend`)**: A Next.js application providing the user interface for customers and restaurant owners.
2.  **API Gateway (`/services/gateway`)**: The single entry point for all client requests. It routes traffic to the appropriate downstream service, simplifying the frontend and enhancing security.
3.  **Services (`/services`)**: A collection of independent Node.js/Express microservices.
4.  **Infrastructure (`docker-compose.yaml`)**:
    *   **MongoDB**: The primary database for all services, providing data persistence.
    *   **Kafka & Zookeeper**: A distributed event streaming platform used for asynchronous communication between services (e.g., notifying the delivery service when an order is paid).

### Services Breakdown:

| Service                | Path                               | Port | Description                                                                                              |
| ---------------------- | ---------------------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| **User Service**       | `/services/user-service`           | 5001 | Handles user registration, login, and profile management. Acts as the authentication service.              |
| **Restaurant Service** | `/services/restaurant-service`     | 5002 | Manages restaurant profiles, menus, and items.                                                           |
| **Order Service**      | `/services/order-service`          | 5003 | Responsible for creating, tracking, and managing customer orders.                                          |
| **Payment Service**    | `/services/payment-service`        | 5004 | Processes payments for orders. It consumes events to know when to process a payment.                       |
| **Delivery Service**   | `/services/delivery-service`       | 5005 | Manages delivery logistics, assigning drivers, and tracking delivery status.                               |
| **Notification Service**| `/services/notification-service`   | 5006 | Sends notifications (e.g., email, SMS, push) to users about their order status.                            |
| **API Gateway**        | `/services/gateway`                | 5000 | Routes incoming requests from the frontend to the appropriate microservice.                                |

## 🛠️ Technology Stack

-   **Frontend**: Next.js, React, TypeScript
-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB
-   **Messaging**: Apache Kafka
-   **Containerization**: Docker, Docker Compose
-   **API Gateway**: Node.js with `http-proxy-middleware`

## ⚙️ Setup and Installation

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the Repository

```bash
git clone https://github.com/Anant3008/ServiceEats.git
cd ServiceEats
```

### 2. Install Dependencies

You need to install the dependencies for the frontend and each microservice.

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install dependencies for each service
for service in services/*; do
  if [ -f "$service/package.json" ]; then
    echo "Installing dependencies for $service..."
    (cd "$service" && npm install)
  fi
done
```

### 3. Configure Environment Variables

Each service and the frontend require a `.env` file for configuration. You can typically copy an existing `.env.example` file if one is provided, or create a new one.

**Key variables to set:**

-   `MONGO_URI=mongodb://localhost:27017/service-eats` (for services using MongoDB)
-   `KAFKA_BROKER=localhost:9092` (for services using Kafka)
-   `JWT_SECRET=your-super-secret-key` (for the User Service)
-   `PORT` (for each service, e.g., `PORT=5001` for `user-service`)

## ▶️ How to Run the Project

### 1. Start Infrastructure Services

First, launch the core infrastructure (MongoDB, Kafka, Zookeeper) using Docker Compose.

```bash
docker-compose up -d
```

This command will start the containers in detached mode.

### 2. Run the Microservices

Open a separate terminal for each microservice you want to run and start it using the `dev` script.

```bash
# Example for user-service
cd services/user-service
npm run dev

# Example for restaurant-service
cd services/restaurant-service
npm run dev

# ...and so on for all other services
```

### 3. Run the API Gateway

The gateway is crucial as it directs traffic.

```bash
cd services/gateway
npm run dev
```

### 4. Run the Frontend

Finally, start the Next.js frontend application.

```bash
cd frontend
npm run dev
```

You should now be able to access the application at `http://localhost:3000`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.
