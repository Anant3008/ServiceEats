# ServiceEats API Reference

## Table of Contents
- [Authentication](#authentication)
- [User Service](#user-service)
- [Restaurant Service](#restaurant-service)
- [Order Service](#order-service)
- [Cart Service](#cart-service)
- [Payment Service](#payment-service)
- [Delivery Service](#delivery-service)
- [Notification Service](#notification-service)
- [Error Codes](#error-codes)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Obtaining a Token
Use the `/api/auth/login` endpoint to obtain a JWT token.

---

## User Service

**Base URL:** `http://localhost:3000/api`

### Authentication Routes

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully"
}
```

**Errors:**
- `400` - User already exists / Validation error
- `500` - Server error

---

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Token Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "user"
}
```

**Errors:**
- `400` - Invalid credentials
- `500` - Server error

---

### Profile Routes

#### Get User Profile
```http
GET /profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "user",
  "addresses": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "label": "Home",
      "street": "123 Main St",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001",
      "isDefault": true
    }
  ],
  "createdAt": "2024-01-20T10:30:00Z",
  "updatedAt": "2024-01-20T10:30:00Z"
}
```

**Errors:**
- `401` - Unauthorized (no token)
- `404` - User not found
- `500` - Server error

---

#### Update User Profile
```http
PUT /profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "addresses": [...]
  }
}
```

**Errors:**
- `401` - Unauthorized
- `404` - User not found
- `500` - Server error

---

#### Add Address
```http
POST /profile/address
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "label": "Office",
  "street": "456 Tech Park",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "isDefault": false
}
```

**Response:** `201 Created`
```json
{
  "message": "Address added successfully",
  "addresses": [...]
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `404` - User not found
- `500` - Server error

---

#### Update Address
```http
PUT /profile/address/:addressId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "label": "New Office",
  "street": "789 Tech Hub",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Address updated successfully",
  "addresses": [...]
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Address not found
- `500` - Server error

---

#### Delete Address
```http
DELETE /profile/address/:addressId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Address deleted successfully",
  "addresses": [...]
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Address not found
- `500` - Server error

---

## Restaurant Service

**Base URL:** `http://localhost:3000/api/restaurants`

#### Add Restaurant
```http
POST /add
```

**Request Body:**
```json
{
  "name": "Pizza Palace",
  "address": "123 Food Street, Pune",
  "cuisine": "Italian",
  "rating": 4.5,
  "menu": [
    {
      "name": "Margherita Pizza",
      "price": 299,
      "category": "Pizza",
      "description": "Classic cheese pizza",
      "isAvailable": true
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "message": "Restaurant added successfully",
  "restaurant": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Pizza Palace",
    "address": "123 Food Street, Pune",
    "cuisine": "Italian",
    "rating": 4.5,
    "menu": [...]
  }
}
```

**Errors:**
- `400` - Validation error
- `500` - Server error

---

#### Get All Restaurants
```http
GET /
```

**Response:** `200 OK`
```json
{
  "restaurants": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Pizza Palace",
      "address": "123 Food Street, Pune",
      "cuisine": "Italian",
      "rating": 4.5,
      "menu": [...]
    }
  ]
}
```

**Errors:**
- `500` - Server error

---

#### Get Restaurant by ID
```http
GET /:id
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Pizza Palace",
  "address": "123 Food Street, Pune",
  "cuisine": "Italian",
  "rating": 4.5,
  "menu": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Margherita Pizza",
      "price": 299,
      "category": "Pizza",
      "description": "Classic cheese pizza",
      "isAvailable": true
    }
  ]
}
```

**Errors:**
- `404` - Restaurant not found
- `500` - Server error

---

## Order Service

**Base URL:** `http://localhost:3000/api/orders`

#### Create Order
```http
POST /create
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restaurantId": "507f1f77bcf86cd799439013",
  "items": [
    {
      "menuItemId": "507f1f77bcf86cd799439014",
      "name": "Margherita Pizza",
      "price": 299,
      "quantity": 2
    }
  ],
  "totalAmount": 598,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Pune",
    "pincode": "411001"
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "restaurantId": "507f1f77bcf86cd799439013",
    "items": [...],
    "totalAmount": 598,
    "status": "created",
    "paymentStatus": "pending",
    "createdAt": "2024-01-20T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error / Invalid menu items
- `401` - Unauthorized
- `500` - Server error

---

#### Get All Orders
```http
GET /
```

**Response:** `200 OK`
```json
{
  "orders": [...]
}
```

**Errors:**
- `500` - Server error

---

#### Get Orders by User
```http
GET /user/:userId?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response:** `200 OK`
```json
{
  "orders": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  }
}
```

**Errors:**
- `401` - Unauthorized
- `500` - Server error

---

#### Get Order by ID
```http
GET /:orderId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439011",
  "restaurantId": "507f1f77bcf86cd799439013",
  "items": [...],
  "totalAmount": 598,
  "status": "created",
  "paymentStatus": "pending",
  "deliveryAddress": {...},
  "createdAt": "2024-01-20T10:30:00Z"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Order not found
- `500` - Server error

---

## Cart Service

**Base URL:** `http://localhost:3000/api/cart`

**Note:** All cart routes require authentication.

#### Get Cart
```http
GET /
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "userId": "507f1f77bcf86cd799439011",
  "restaurantId": "507f1f77bcf86cd799439013",
  "restaurantName": "Pizza Palace",
  "items": [
    {
      "menuItemId": "507f1f77bcf86cd799439014",
      "name": "Margherita Pizza",
      "price": 299,
      "quantity": 2,
      "isAvailable": true
    }
  ],
  "totalAmount": 598,
  "status": "active"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Cart not found
- `500` - Server error

---

#### Add to Cart
```http
POST /add
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restaurantId": "507f1f77bcf86cd799439013",
  "restaurantName": "Pizza Palace",
  "menuItemId": "507f1f77bcf86cd799439014",
  "name": "Margherita Pizza",
  "price": 299,
  "quantity": 1
}
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "userId": "507f1f77bcf86cd799439011",
  "restaurantId": "507f1f77bcf86cd799439013",
  "items": [...],
  "totalAmount": 299
}
```

**Errors:**
- `400` - Cannot add items from different restaurant
- `401` - Unauthorized
- `500` - Server error

---

#### Update Cart Item
```http
PUT /update
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "menuItemId": "507f1f77bcf86cd799439014",
  "quantity": 3
}
```

**Note:** Set quantity to 0 to remove item.

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "items": [...],
  "totalAmount": 897
}
```

**Errors:**
- `400` - Invalid quantity
- `401` - Unauthorized
- `404` - Cart or item not found
- `500` - Server error

---

#### Remove from Cart
```http
POST /remove
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "menuItemId": "507f1f77bcf86cd799439014"
}
```

**Response:** `200 OK`
```json
{
  "message": "Item removed from cart",
  "cart": {...}
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Cart or item not found
- `500` - Server error

---

#### Clear Cart
```http
DELETE /clear
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Cart cleared successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Cart not found
- `500` - Server error

---

#### Checkout
```http
POST /checkout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `201 Created`
```json
{
  "message": "Order created from cart",
  "order": {...}
}
```

**Errors:**
- `400` - Cart is empty
- `401` - Unauthorized
- `404` - Cart not found
- `500` - Server error

---

## Payment Service

**Base URL:** `http://localhost:3000/api/payments`

#### Create Payment
```http
POST /
```

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 598,
  "currency": "inr",
  "paymentMethod": "card"
}
```

**Response:** `201 Created`
```json
{
  "paymentId": "507f1f77bcf86cd799439017",
  "orderId": "507f1f77bcf86cd799439015",
  "clientSecret": "pi_xxx_secret_xxx",
  "providerPaymentId": "pi_xxx",
  "status": "processing",
  "message": "Use clientSecret to complete payment on frontend"
}
```

**Errors:**
- `400` - Payment already exists / Validation error
- `500` - Server error / Stripe error

---

#### Get All Payments
```http
GET /
```

**Response:** `200 OK`
```json
{
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "orderId": "507f1f77bcf86cd799439015",
      "userId": "507f1f77bcf86cd799439011",
      "amount": 598,
      "currency": "inr",
      "status": "succeeded",
      "providerPaymentId": "pi_xxx"
    }
  ]
}
```

**Errors:**
- `500` - Server error

---

#### Get Payment by Order ID
```http
GET /:orderId
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "orderId": "507f1f77bcf86cd799439015",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 598,
  "currency": "inr",
  "status": "succeeded",
  "providerPaymentId": "pi_xxx",
  "createdAt": "2024-01-20T10:30:00Z"
}
```

**Errors:**
- `404` - Payment not found
- `500` - Server error

---

#### Stripe Webhook
```http
POST /webhooks/stripe
```

**Headers:**
```
stripe-signature: <webhook_signature>
```

**Note:** This endpoint is called by Stripe directly. Do not call manually.

**Response:** `200 OK`
```json
{
  "message": "Webhook processed successfully"
}
```

---

## Delivery Service

**Base URL:** `http://localhost:3000/api/deliveries`

#### Get All Deliveries
```http
GET /
```

**Response:** `200 OK`
```json
{
  "deliveries": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "orderId": "507f1f77bcf86cd799439015",
      "driverId": "507f1f77bcf86cd799439019",
      "status": "assigned",
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ]
}
```

**Errors:**
- `500` - Server error

---

#### Get Delivery by Order ID
```http
GET /:orderId
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439018",
  "orderId": "507f1f77bcf86cd799439015",
  "driverId": "507f1f77bcf86cd799439019",
  "status": "assigned",
  "estimatedTime": 30,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

**Errors:**
- `404` - Delivery not found
- `500` - Server error

---

## Notification Service

**Base URL:** `http://localhost:3000/api/notifications`

#### Get All Notifications
```http
GET /
```

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "507f1f77bcf86cd799439011",
      "orderId": "507f1f77bcf86cd799439015",
      "type": "order_placed",
      "message": "Your order has been placed successfully",
      "isRead": false,
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ]
}
```

**Errors:**
- `500` - Server error

---

#### Get Notifications by User ID
```http
GET /user/:userId
```

**Response:** `200 OK`
```json
{
  "notifications": [...]
}
```

**Errors:**
- `404` - No notifications found
- `500` - Server error

---

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Request completed successfully |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid input or validation error |
| `401` | Unauthorized - Missing or invalid authentication token |
| `403` | Forbidden - Valid token but insufficient permissions |
| `404` | Not Found - Requested resource does not exist |
| `500` | Internal Server Error - Server-side error |

### Common Error Response Format

```json
{
  "message": "Error description",
  "error": "Detailed error message (dev mode only)"
}
```

Or with validation errors:
```json
{
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Notes

### API Gateway
All requests should go through the API Gateway at `http://localhost:3000`. The gateway proxies requests to the appropriate microservice.

### Kafka Events
The following Kafka events are published internally between services:
- `user_created` - When a new user registers
- `order_created` - When an order is placed
- `payment.pending` - Payment intent created
- `payment.succeeded` - Payment completed
- `delivery.assigned` - Driver assigned to order
- `delivery.completed` - Delivery finished

### Rate Limiting
Currently not implemented. Consider adding rate limiting for production.

### CORS
CORS is enabled on the API Gateway for all origins in development. Configure appropriately for production.

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Restaurants
```bash
curl -X GET http://localhost:3000/api/restaurants
```

---

## Environment Variables

### Required Environment Variables

**User Service:**
```
PORT=4001
MONGO_URI=mongodb://localhost:27017/service-eats-users
JWT_SECRET=your_jwt_secret
KAFKA_BROKER=localhost:9092
```

**Payment Service:**
```
PORT=4005
MONGO_URI=mongodb://localhost:27017/service-eats-payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
KAFKA_BROKER=localhost:9092
```

**Frontend:**
```
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
```

---

**Last Updated:** January 20, 2026  
**Version:** 1.0.0  
**Maintained by:** ServiceEats Team
