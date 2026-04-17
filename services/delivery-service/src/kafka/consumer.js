const { Kafka } = require("kafkajs");
const Delivery = require("../models/delivery.model");
const { produceEvent } = require("./producer");

const kafka = new Kafka({
  clientId: "delivery-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "delivery-group" });
const GATEWAY_URL = process.env.GATEWAY_URL || "http://gateway-service:3000";

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "payment.succeeded", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log("Received payment.succeeded event:", data);

      // Delivery service assigns its own driver and location
      const assignedDriverName = "Rahul Sharma";
      const assignedLocation = { latitude: 17.385, longitude: 78.4867 }; // Hyderabad

      const delivery = await Delivery.create({
        orderId: data.orderId,
        driverName: assignedDriverName,
        status: "assigned",
        location: assignedLocation,
      });

      console.log(
        "Delivery assigned to driver:",
        assignedDriverName,
        "for order:",
        data.orderId,
      );

      // ✅ Include userId in all events for notification service
      await produceEvent("delivery.assigned", {
        orderId: delivery.orderId,
        userId: data.userId,
        driverName: delivery.driverName,
        location: delivery.location,
        status: delivery.status,
      });

      setTimeout(async () => {
        delivery.status = "delivered";
        await delivery.save();

        // ✅ Include userId in delivery.completed event
        await produceEvent("delivery.completed", {
          orderId: delivery.orderId,
          userId: data.userId,
          driverName: delivery.driverName,
          location: delivery.location,
          status: delivery.status,
        });
        console.log("Delivery completed for order:", data.orderId);
      }, 15000);
    },
  });
};

module.exports = { startConsumer };
