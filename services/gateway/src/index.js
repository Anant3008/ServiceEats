const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:4002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:4003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4005';
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:4004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4006';

app.use('/api/auth', createProxyMiddleware({
  target: `${USER_SERVICE_URL}/api/auth`,
  changeOrigin: true
}));

app.use('/api/profile', createProxyMiddleware({
  target: `${USER_SERVICE_URL}/api/profile`,
  changeOrigin: true
}));

app.use('/api/restaurants', createProxyMiddleware({
  target: `${RESTAURANT_SERVICE_URL}/api/restaurants`,
  changeOrigin: true
}));

app.use('/api/orders', createProxyMiddleware({
  target: `${ORDER_SERVICE_URL}/api/orders`,
  changeOrigin: true
}));

app.use('/api/cart', createProxyMiddleware({
  target: `${ORDER_SERVICE_URL}/api/cart`,
  changeOrigin: true
}));

app.use('/api/payments', createProxyMiddleware({
  target: `${PAYMENT_SERVICE_URL}/api/payments`,
  changeOrigin: true
}));

app.use('/api/deliveries', createProxyMiddleware({
  target: `${DELIVERY_SERVICE_URL}/api/deliveries`,
  changeOrigin: true
}));

app.use('/api/notifications', createProxyMiddleware({
  target: `${NOTIFICATION_SERVICE_URL}/api/notifications`,
  changeOrigin: true
}));

app.use('/api/ratings', createProxyMiddleware({
  target: `${ORDER_SERVICE_URL}/api/ratings`,
  changeOrigin: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Gateway is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});