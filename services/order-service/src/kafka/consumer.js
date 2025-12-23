const { Kafka } = require('kafkajs');
const Order = require('../models/order.model');

const kafka = new Kafka({
    clientId: 'order-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'order-group' });

const startConsumer = async () => {
    await consumer.connect();

    // Subscribe to payment_success events
    await consumer.subscribe({ topic: 'payment_success', fromBeginning: false });
    
    // Subscribe to delivery_assigned events
    await consumer.subscribe({ topic: 'delivery_assigned', fromBeginning: false });
    
    // Subscribe to delivery_completed events
    await consumer.subscribe({ topic: 'delivery_completed', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const data = JSON.parse(message.value.toString());
            console.log(`Received ${topic} event:`, data);

            try {
                if (topic === 'payment_success') {
                    // Update order payment status when payment is successful
                    const order = await Order.findByIdAndUpdate(
                        data.orderId,
                        { paymentStatus: 'paid' },
                        { new: true }
                    );
                    console.log('Order payment status updated to paid:', data.orderId);
                } else if (topic === 'delivery_assigned') {
                    // Update order delivery status when delivery is assigned
                    const order = await Order.findByIdAndUpdate(
                        data.orderId,
                        { deliveryStatus: 'pending' }, // Still pending, but driver assigned
                        { new: true }
                    );
                    console.log('Order delivery status updated (driver assigned):', data.orderId);
                } else if (topic === 'delivery_completed') {
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
