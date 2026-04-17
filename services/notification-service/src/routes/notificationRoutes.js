const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth.middleware");

const {
  getAllNotifications,
  getMyNotifications,
  getNotificationsByUserId,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notification.controller");

// =====================================================
// AUTHENTICATED ROUTES (require JWT token)
// =====================================================

// Get current user's notifications (paginated)
// GET /api/notifications/me?page=1&limit=20
router.get("/me", authenticateToken, getMyNotifications);

// Get unread count for current user
// GET /api/notifications/unread-count
router.get("/unread-count", authenticateToken, getUnreadCount);

// Mark single notification as read
// PUT /api/notifications/:notificationId/read
router.put("/:notificationId/read", authenticateToken, markAsRead);

// Mark all notifications as read
// PUT /api/notifications/read-all
router.put("/read-all", authenticateToken, markAllAsRead);

// Delete a single notification
// DELETE /api/notifications/:notificationId
router.delete("/:notificationId", authenticateToken, deleteNotification);

// Clear all notifications
// DELETE /api/notifications/clear-all
router.delete("/clear-all", authenticateToken, clearAllNotifications);

// =====================================================
// LEGACY ROUTES (for backward compatibility)
// =====================================================

// Get all notifications (admin/debug)
router.get("/", getAllNotifications);

// Get notifications by userId (legacy - prefer /me endpoint)
router.get("/user/:userId", getNotificationsByUserId);

module.exports = router;
