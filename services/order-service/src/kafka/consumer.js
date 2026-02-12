const { Kafka } = require('kafkajs');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');

const kafka = new Kafka({
    clientId: 'order-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'order-group' });

const startConsumer = async () => {
    await consumer.connect();

    // Subscribe to payment events (dotted naming)
    await consumer.subscribe({ topic: 'payment.succeeded', fromBeginning: false });
    
    // Subscribe to delivery events (dotted naming)
    await consumer.subscribe({ topic: 'delivery.assigned', fromBeginning: false });
    await consumer.subscribe({ topic: 'delivery.completed', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const data = JSON.parse(message.value.toString());
            console.log(`Received ${topic} event:`, data);

            try {
                if (topic === 'payment.succeeded') {
                    // ✅ FIXED: Create order from cart when payment succeeds
                    const cart = await Cart.findOne({ userId: data.userId, status: 'active' });
                    
                    if (cart && cart.items.length > 0) {
                        // Create order from cart
                        const newOrder = new Order({
                            _id: data.orderId, // keep same id used in events (cart id)
                            userId: data.userId,
                            restaurantId: cart.restaurantId,
                            items: cart.items,
                            totalAmount: cart.totalAmount,
                            paymentStatus: 'paid', // Payment succeeded
                            deliveryStatus: 'pending',
                            paymentId: data.paymentId // Store payment reference
                        });

                        await newOrder.save();

                        // Mark cart as ordered (convert cart to order)
                        cart.status = 'ordered';
                        await cart.save();

                        console.log(`Order created from cart for user ${data.userId}:`, newOrder._id);
                    } else {
                        // If no active cart, create standalone order (if orderId exists in payment event)
                        if (data.orderId) {
                            const existingOrder = await Order.findById(data.orderId);
                            if (existingOrder) {
                                existingOrder.paymentStatus = 'paid';
                                await existingOrder.save();
                                console.log('Order payment status updated to paid:', data.orderId);
                            }
                        }
                    }
                } else if (topic === 'delivery.assigned') {
                    // Update order delivery status when delivery is assigned
                    const order = await Order.findByIdAndUpdate(
                        data.orderId,
                        { deliveryStatus: 'pending' }, // Still pending, but driver assigned
                        { new: true }
                    );
                    console.log('Order delivery status updated (driver assigned):', data.orderId);
                } else if (topic === 'delivery.completed') {
                    // Update order delivery status when delivery is completed
                    const order = await Order.findByIdAndUpdate(
                        data.orderId,
                        { deliveryStatus: 'completed' },
                        { new: true }
                    );
                    console.log('Order delivery status updated to completed:', data.orderId);
                }
            } catch (error) {
                console.error(`Error processing ${topic} event:`, error);
            }
        },
    });
};

module.exports = { startConsumer };
