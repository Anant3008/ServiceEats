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
    await consumer.subscribe({topic: 'order_confirmed', fromBeginning: true});

    await consumer.run({
        eachMessage: async({topic,message}) => {
            const data = JSON.parse(message.value.toString());
            console.log('Received order_confirmed event:', data);

            const delivery = await Delivery.create({
                orderId: data.orderId,
                driverName: data.driverName,
                status: 'assigned',
                location: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude
                }
            });

            console.log('Delivery assigned to driver:', data.driverName, 'for order:', data.orderId);

            await produceEvent('payment_success', {
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