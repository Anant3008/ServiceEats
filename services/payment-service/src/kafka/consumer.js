const { Kafka } = require("kafkajs");
const Payment = require("../models/payment.model");
const { produceEvent } = require("./producer");

const kafka = new Kafka({
  clientId: "payment-service",
  brokers: (
    process.env.KAFKA_BROKERS || "kafka-1:9092,kafka-2:9092,kafka-3:9092"
  ).split(","),
});

const consumer = kafka.consumer({ groupId: "payment-group" });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "order_created", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log("Received order_created event:", data);

      const payment = await Payment.create({
        orderId: data.orderId,
        userId: data.userId,
        amount: data.totalAmount,
        status: "success",
      });

      console.log("Payment successful for order:", data.orderId);

      await produceEvent("payment_success", {
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        status: payment.status,
      });
    },
  });
};

module.exports = { startConsumer };
