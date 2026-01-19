const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.use('/api/auth', createProxyMiddleware({
  target: 'http://user-service:4001/api/auth',
  changeOrigin: true
}));

app.use('/api/profile', createProxyMiddleware({
  target: 'http://user-service:4001/api/profile',
  changeOrigin: true
}));

app.use('/api/restaurants', createProxyMiddleware({
  target: 'http://restaurant-service:4002/api/restaurants',
  changeOrigin: true
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:4003/api/orders',
  changeOrigin: true
}));

app.use('/api/cart', createProxyMiddleware({
  target: 'http://order-service:4003/api/cart',
  changeOrigin: true
}));

app.use('/api/payments', createProxyMiddleware({
  target: 'http://payment-service:4005/api/payments',
  changeOrigin: true
}));

app.use('/api/deliveries', createProxyMiddleware({
  target: 'http://delivery-service:4004/api/deliveries',
  changeOrigin: true
}));

app.use('/api/notifications', createProxyMiddleware({
  target: 'http://notification-service:4006/api/notifications',
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