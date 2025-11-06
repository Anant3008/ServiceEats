const Order = require('../models/order.model');
const axios=require('axios');
const { produceEvent } = require('../kafka/producer');

const createOrder = async (req, res) => {
    try {
        const { userId, restaurantId, items } = req.body;

        const {data: restaurant} = await axios.get(`http://localhost:3001/restaurants/${restaurantId}`);

        if(!restaurant){
            return res.status(404).json({error:'Restaurant not found'});
        }

        let totalAmount = 0;
        const validatedItems = [];
        for (const item of items) {
            const menuItem = restaurant.menu.find(menuItem => menuItem.name === item.name);
            if (!menuItem || !menuItem.available) {
                return res.status(400).json({ error: `Menu item not found or unavailable: ${item.name}` });
            }
            const itemTotal = menuItem.price * item.quantity;
            validatedItems.push({ ...item, price: menuItem.price });
            totalAmount += itemTotal;
        }

        // Create a new order
        const newOrder = new Order({
            userId,
            restaurantId,
            items: validatedItems,
            totalAmount
        });

        // Save the order to the database
        await newOrder.save();

        // Produce a Kafka event
        await produceEvent('order_created', {
            orderId: newOrder._id,
            userId,
            restaurantId,
            items: validatedItems,
            totalAmount,
            status: "created"
        });

        // Send a response
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getallOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getOrdersByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ userId });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders by user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createOrder,
    getallOrders,
    getOrdersByUser
};