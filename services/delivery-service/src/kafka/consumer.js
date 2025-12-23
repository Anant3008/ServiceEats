const {Kafka} = require('kafkajs');
const Delivery = require('../models/delivery.model');
const {produceEvent} = require('./producer');

const kafka = new Kafka({
    clientId: 'delivery-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({groupId: 'delivery-group'});

const startConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({topic: 'payment_success', fromBeginning: true});

    await consumer.run({
        eachMessage: async({topic,message}) => {
            const data = JSON.parse(message.value.toString());
            console.log('Received payment_success event:', data);

            // Delivery service assigns its own driver and location
            const assignedDriverName = 'Rahul Sharma';
            const assignedLocation = { latitude: 17.3850, longitude: 78.4867 }; // Hyderabad

            const delivery = await Delivery.create({
                orderId: data.orderId,
                driverName: assignedDriverName,
                status: 'assigned',
                location: assignedLocation
            });

            console.log('Delivery assigned to driver:', assignedDriverName, 'for order:', data.orderId);

            await produceEvent('delivery_assigned', {
                orderId: delivery.orderId,
                driverName: delivery.driverName,
                location: delivery.location,
                status: delivery.status
            });

            setTimeout(async () => {
                delivery.status = 'delivered';
                await delivery.save();

                await produceEvent('delivery_completed', {
                    orderId: delivery.orderId,
                    driverName: delivery.driverName,
                    location: delivery.location,
                    status: delivery.status
                });
                console.log('Delivery completed for order:', data.orderId);
            }, 15000);

        }
    });
};

module.exports = {startConsumer};