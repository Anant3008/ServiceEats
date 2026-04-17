const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Index for faster queries
    },
    orderId: {
      type: String,
      required: false, // Not all notifications are order-related
    },
    type: {
      type: String,
      enum: [
        "order_created",
        "order_confirmed",
        "payment_success",
        "payment_failed",
        "delivery_assigned",
        "delivery_picked_up",
        "delivery_completed",
        "promo",
        "system",
      ],
      default: "system",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Index for unread count queries
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For extra data like restaurantName, amount, etc.
      default: {},
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index: deletes when expiresAt <= now
    },
  },
  { timestamps: true },
);

// Compound index for efficient user + unread queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
