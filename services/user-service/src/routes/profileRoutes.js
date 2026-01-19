const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/profile.controller');

// All routes require authentication
router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);
router.post('/address', authenticateToken, addAddress);
router.put('/address/:addressId', authenticateToken, updateAddress);
router.delete('/address/:addressId', authenticateToken, deleteAddress);

module.exports = router;
