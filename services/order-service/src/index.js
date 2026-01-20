const express=require('express');
require('dotenv').config();
const connectDB=require('./config/db');
const orderRoutes=require('./routes/orderRoutes');
const cartRoutes=require('./routes/cartRoutes');
const ratingRoutes=require('./routes/ratingRoutes');
const {startConsumer} = require('./kafka/consumer')
const app=express();

app.use(express.json());
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ratings', ratingRoutes);


const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(process.env.PORT || 4003, () => {
      console.log(`Order Service running on port ${process.env.PORT || 4003}`);
    });

    await startConsumer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();