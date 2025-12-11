const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', createProxyMiddleware({
  target: 'http://user-service:4001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

app.use('/api/restaurants', createProxyMiddleware({
  target: 'http://restaurant-service:4002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/restaurants': '/api/restaurants'
  }
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:4003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  }
}));

app.use('/api/cart', createProxyMiddleware({
  target: 'http://order-service:4003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  }
}));

app.use('/api/payments', createProxyMiddleware({
  target: 'http://payment-service:4004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  }
}));

app.use('/api/deliveries', createProxyMiddleware({
  target: 'http://delivery-service:4005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/deliveries': '/api/deliveries'
  }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: 'http://notification-service:4006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  }
}));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Gateway is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});