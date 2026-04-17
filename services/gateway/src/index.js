const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
require("dotenv").config();
const { notFound, errorHandler } = require("./middleware/errorHandler");
const {
  authLimiter,
  apiLimiter,
  strictLimiter,
} = require("./middleware/rateLimiting");

const app = express();

app.use(cors());

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:4001";
const RESTAURANT_SERVICE_URL =
  process.env.RESTAURANT_SERVICE_URL || "http://restaurant-service:4002";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:4003";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://payment-service:4005";
const DELIVERY_SERVICE_URL =
  process.env.DELIVERY_SERVICE_URL || "http://delivery-service:4004";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4006";

// Apply method-aware limits: reads can be frequent (polling), writes stay strict.
const ordersRateLimiter = (req, res, next) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return apiLimiter(req, res, next);
  }
  return strictLimiter(req, res, next);
};

// =====================================================
// AUTH ENDPOINTS - Strict rate limiting (prevent brute force)
// =====================================================
app.use(
  "/api/auth",
  authLimiter,
  createProxyMiddleware({
    target: `${USER_SERVICE_URL}/api/auth`,
    changeOrigin: true,
  }),
);

// =====================================================
// PROFILE ENDPOINTS - Moderate rate limiting
// =====================================================
app.use(
  "/api/profile",
  apiLimiter,
  createProxyMiddleware({
    target: `${USER_SERVICE_URL}/api/profile`,
    changeOrigin: true,
  }),
);

// =====================================================
// READ-HEAVY ENDPOINTS - Moderate rate limiting
// =====================================================
app.use(
  "/api/restaurants",
  apiLimiter,
  createProxyMiddleware({
    target: `${RESTAURANT_SERVICE_URL}/api/restaurants`,
    changeOrigin: true,
  }),
);

// =====================================================
// WRITE-HEAVY ENDPOINTS - Strict rate limiting
// =====================================================
// Orders use mixed traffic: GET endpoints are polled by clients, writes remain strict.
app.use(
  "/api/orders",
  ordersRateLimiter,
  createProxyMiddleware({
    target: `${ORDER_SERVICE_URL}/api/orders`,
    changeOrigin: true,
  }),
);

// Cart operations trigger database writes
app.use(
  "/api/cart",
  strictLimiter,
  createProxyMiddleware({
    target: `${ORDER_SERVICE_URL}/api/cart`,
    changeOrigin: true,
  }),
);

// Ratings are write operations
app.use(
  "/api/ratings",
  strictLimiter,
  createProxyMiddleware({
    target: `${ORDER_SERVICE_URL}/api/ratings`,
    changeOrigin: true,
  }),
);

// =====================================================
// PAYMENT ENDPOINTS - Strictest rate limiting
// =====================================================
// Payments are critically expensive (Stripe charges, Kafka events)
app.use(
  "/api/payments",
  strictLimiter,
  createProxyMiddleware({
    target: `${PAYMENT_SERVICE_URL}/api/payments`,
    changeOrigin: true,
  }),
);

// =====================================================
// DELIVERY ENDPOINTS - Moderate rate limiting
// =====================================================
app.use(
  "/api/deliveries",
  apiLimiter,
  createProxyMiddleware({
    target: `${DELIVERY_SERVICE_URL}/api/deliveries`,
    changeOrigin: true,
  }),
);

// =====================================================
// NOTIFICATION ENDPOINTS - Moderate rate limiting
// =====================================================
app.use(
  "/api/notifications",
  apiLimiter,
  createProxyMiddleware({
    target: `${NOTIFICATION_SERVICE_URL}/api/notifications`,
    changeOrigin: true,
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Gateway is running" });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
