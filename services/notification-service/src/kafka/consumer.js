const { Kafka } = require("kafkajs");
const Notification = require("../models/notification.model");

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: (
    process.env.KAFKA_BROKERS || "kafka-1:9092,kafka-2:9092,kafka-3:9092"
  ).split(","),
});

const consumer = kafka.consumer({ groupId: "notification-group" });

// Notification templates for different event types
const notificationTemplates = {
  order_created: (data) => ({
    type: "order_created",
    title: "Order Placed! 🎉",
    message: `Your order from ${data.restaurantName || "the restaurant"} has been placed successfully.`,
    metadata: {
      restaurantName: data.restaurantName,
      totalAmount: data.totalAmount,
      itemCount: data.items?.length || 0,
    },
  }),

  "payment.pending": (data) => ({
    type: "payment_pending",
    title: "Payment Processing ⏳",
    message: `Processing payment of ₹${data.amount || 0} for your order.`,
    metadata: {
      amount: data.amount,
    },
  }),

  "payment.succeeded": (data) => ({
    type: "payment_success",
    title: "Payment Successful ✅",
    message: `Payment of ₹${data.amount || 0} received! Your order is being prepared.`,
    metadata: {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
    },
  }),

  "payment.failed": (data) => ({
    type: "payment_failed",
    title: "Payment Failed ❌",
    message: `Payment failed. Please try again or use a different payment method.`,
    metadata: {
      amount: data.amount,
      reason: data.reason,
    },
  }),

  "delivery.assigned": (data) => ({
    type: "delivery_assigned",
    title: "Driver Assigned 🚗",
    message: `${data.driverName || "A driver"} is picking up your order!`,
    metadata: {
      driverName: data.driverName,
      estimatedTime: data.estimatedTime,
    },
  }),

  "delivery.picked_up": (data) => ({
    type: "delivery_picked_up",
    title: "Order Picked Up 📦",
    message: `Your order has been picked up and is on the way!`,
    metadata: {
      driverName: data.driverName,
    },
  }),

  "delivery.completed": (data) => ({
    type: "delivery_completed",
    title: "Order Delivered! 🎉",
    message: `Your order has been delivered. Enjoy your meal!`,
    metadata: {
      deliveredAt: new Date().toISOString(),
    },
  }),
};

// Topics to subscribe to
const TOPICS = [
  "order_created",
  "payment.pending",
  "payment.succeeded",
  "payment.failed",
  "delivery.assigned",
  "delivery.picked_up",
  "delivery.completed",
];

const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log("📡 Kafka consumer connected");

    // Subscribe to all topics
    for (const topic of TOPICS) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`📥 Subscribed to topic: ${topic}`);
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`📦 Received ${topic} event:`, data);

          // Get notification template for this topic
          const template = notificationTemplates[topic];

          if (!template) {
            console.warn(`⚠️ No template for topic: ${topic}`);
            return;
          }

          // Ensure we have userId
          if (!data.userId) {
            console.warn(`⚠️ No userId in event data for ${topic}`);
            return;
          }

          // Generate notification content from template
          const notificationContent = template(data);

          // Create notification
          const notification = await Notification.create({
            userId: data.userId,
            orderId: data.orderId || null,
            type: notificationContent.type,
            title: notificationContent.title,
            message: notificationContent.message,
            metadata: notificationContent.metadata,
            isRead: false,
            expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Expires in 2 days
          });

          console.log(
            `🔔 Notification created: ${notification._id} for user ${data.userId}`,
          );
        } catch (parseError) {
          console.error(`❌ Error processing ${topic} message:`, parseError);
        }
      },
    });

    console.log("✅ Notification consumer running");
  } catch (error) {
    console.error("❌ Kafka consumer error:", error);

    // Retry connection after 5 seconds
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(startConsumer, 5000);
  }
};

// Graceful shutdown
const stopConsumer = async () => {
  try {
    await consumer.disconnect();
    console.log("📡 Kafka consumer disconnected");
  } catch (error) {
    console.error("Error disconnecting consumer:", error);
  }
};

module.exports = { startConsumer, stopConsumer };
