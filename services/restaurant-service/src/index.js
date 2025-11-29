const express=require('express');
require('dotenv').config();
const connectDB=require('./config/db');

const app=express();

app.use(express.json());

app.use('/api/restaurants',require('./routes/restaurantRoutes'));

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(process.env.PORT || 4002, () => {
      console.log(`Restaurant Service running on port ${process.env.PORT || 4002}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();