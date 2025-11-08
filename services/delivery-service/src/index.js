const express=require('express');
require('dotenv').config();
const connectDB=require('./config/db');
const {startConsumer}=require('./kafka/consumer');

const app=express();

app.use(express.json());

app.use('/api/deliveries', require('./routes/deliveryRoutes'));


const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(process.env.PORT || 5005, () => {
      console.log(`Payment Service running on port ${process.env.PORT || 5005}`);
    });

    startConsumer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();