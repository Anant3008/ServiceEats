const express = require('express');
const router = express.Router();

const { getAllNotifications, getNotificationsByUserId } = require('../controllers/notification.controller');

router.get('/', getAllNotifications);

router.get('/user/:userId', getNotificationsByUserId);

module.exports = router;