const Notification = require("../models/notification.model");

/**
 * Get all notifications (admin only - for debugging)
 */
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get notifications for authenticated user
 * Supports pagination via query params: ?page=1&limit=20
 */
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
    ]);

    res.status(200).json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get notifications by userId (legacy endpoint - keep for compatibility)
 */
const getNotificationsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications by user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get unread notification count for authenticated user
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId; // From auth middleware

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId }, // Ensure user owns this notification
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Mark all notifications as read for authenticated user
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );

    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId; // From auth middleware

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId, // Ensure user owns this notification
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Clear all notifications for authenticated user
 */
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      message: "All notifications cleared",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllNotifications,
  getMyNotifications,
  getNotificationsByUserId,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
