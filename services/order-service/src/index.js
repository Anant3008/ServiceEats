const express=require('express');
require('dotenv').config();
const connectDB=require('./config/db');
const orderRoutes=require('./routes/orderRoutes');

const app=express();

app.use(express.json());
app.use('/api/orders', orderRoutes);


const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(process.env.PORT || 4003, () => {
      console.log(`Order Service running on port ${process.env.PORT || 4003}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();