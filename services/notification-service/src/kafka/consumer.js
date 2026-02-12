const { Kafka } = require("kafkajs");
const Notification = require("../models/notification.model");

const kafka = new Kafka({
    clientId: "notification-service",
    brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "notification-group" });

const startConsumer = async () => {
    await consumer.connect();

    await consumer.subscribe({ topic: "delivery.completed", fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const data = JSON.parse(message.value.toString());
            console.log("📦 Received delivery.completed event:", data);

            await Notification.create({
                userId: data.userId,
                orderId: data.orderId,
                message: "Your order has been delivered 🎉",
            });

            console.log("🔔 Notification saved for order:", data.orderId);
        },
    });
};

module.exports = { startConsumer };