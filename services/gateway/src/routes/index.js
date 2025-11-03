const express=require('express');
const {createProxyMiddleware}=require('http-proxy-middleware');
const cors=require('cors');
require('dotenv').config();

const app=express();
app.use(cors());

app.use('/auth', createProxyMiddleware({
  target: "http://auth-service:5001",
  changeOrigin: true,
}));

app.use('/restaurant', createProxyMiddleware({
  target: "http://restaurant-service:5002",
  changeOrigin: true,
}));

app.use('/order', createProxyMiddleware({
  target: "http://order-service:5003",
  changeOrigin: true,
}));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Gateway running on port ${process.env.PORT || 5000}`);
});