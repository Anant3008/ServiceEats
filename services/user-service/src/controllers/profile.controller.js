const User = require('../models/user.model');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      addresses: user.addresses || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile (name, phone)
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const { label, street, city, state, pincode, isDefault } = req.body;

    if (!label || !street || !city || !state || !pincode) {
      return res.status(400).json({ 
        message: 'All address fields are required' 
      });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is marked as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      label,
      street,
      city,
      state,
      pincode,
      isDefault: makeDefault
    });

    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, street, city, state, pincode, isDefault } = req.body;

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update fields
    if (label) address.label = label;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;

    // Handle default flag
    if (isDefault === true) {
      user.addresses.forEach(addr => addr.isDefault = false);
      address.isDefault = true;
    } else if (isDefault === false) {
      address.isDefault = false;
    }

    await user.save();

    res.json({
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
};
