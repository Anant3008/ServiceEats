const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
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
    // New export added below
};

// Process payment and create order from user's active cart
// This is used by the fake payment UI to finalize checkout in one step
const processPaymentFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentMethod } = req.body || {};

        // Find active cart for the user
        const cart = await Cart.findOne({ userId, status: 'active' });
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Create order with pending payment status
        const newOrder = new Order({
            userId,
            restaurantId: cart.restaurantId,
            items: cart.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: cart.totalAmount,
            paymentStatus: 'pending',
            deliveryStatus: 'pending'
        });

        await newOrder.save();

        // Mark cart as ordered so it won't be reused
        cart.status = 'ordered';
        await cart.save();

        // Emit event for payment service to process payment
        await produceEvent('order_created', {
            orderId: newOrder._id,
            userId,
            restaurantId: cart.restaurantId,
            items: cart.items,
            totalAmount: cart.totalAmount,
            paymentMethod: paymentMethod || 'upi',
            status: 'created'
        });

        return res.status(200).json({
            success: true,
            orderId: newOrder._id,
            message: 'Order created, processing payment...'
        });
    } catch (error) {
        console.error('Error processing payment from cart:', error);
        return res.status(500).json({ error: 'Failed to process order' });
    }
};

module.exports.processPaymentFromCart = processPaymentFromCart;