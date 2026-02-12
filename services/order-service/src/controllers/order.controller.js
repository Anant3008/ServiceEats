const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const axios=require('axios');
const { produceEvent } = require('../kafka/producer');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway-service:3000';

const createOrder = async (req, res) => {
    try {
        const { restaurantId, items } = req.body;
        const userId = req.userId; // Get from auth middleware

        // ✅ FIXED: Use gateway instead of direct service call
        const restaurantRes = await axios.get(`${GATEWAY_URL}/api/restaurants/${restaurantId}`);
        const restaurant = restaurantRes.data;

        if (!restaurant) {
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
        const requestedUserId = req.params.userId;
        const authUserId = req.userId;

        // Ensure a user cannot read someone else's orders
        if (requestedUserId !== authUserId) {
            return res.status(403).json({ error: 'Not authorized to view these orders' });
        }

        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ userId: requestedUserId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments({ userId: requestedUserId }),
        ]);

        res.status(200).json({
            items: orders,
            total,
            page,
            limit,
        });
    } catch (error) {
        console.error('Error fetching orders by user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get order by ID (with auth check - user can only see their own orders)
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.userId;

        const order = await Order.findOne({ _id: orderId });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user owns this order
        if (order.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to view this order' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createOrder,
    getallOrders,
    getOrdersByUser,
    getOrderById,
};