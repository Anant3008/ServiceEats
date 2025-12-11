const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const axios = require('axios');
const { produceEvent } = require('../kafka/producer');

// Get user's active cart
const getCart = async (req, res) => {
    try {
        const userId = req.userId;
        
        let cart = await Cart.findOne({ userId, status: 'active' });
        
        if (!cart) {
            return res.status(200).json({ 
                cart: null, 
                message: 'Cart is empty' 
            });
        }
        
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { restaurantId, restaurantName, menuItemId, name, price, quantity = 1 } = req.body;

        if (!restaurantId || !menuItemId || !name || !price) {
            return res.status(400).json({ 
                error: 'Restaurant ID, menu item ID, name, and price are required' 
            });
        }

        // Find or create active cart
        let cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart) {
            // Create new cart
            cart = new Cart({
                userId,
                restaurantId,
                restaurantName,
                items: [],
                totalAmount: 0
            });
        } else {
            // Check if cart is from different restaurant
            if (cart.restaurantId !== restaurantId) {
                return res.status(400).json({ 
                    error: 'Cannot add items from different restaurant. Clear cart first.',
                    currentRestaurant: cart.restaurantName
                });
            }
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.menuItemId === menuItemId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                menuItemId,
                name,
                price,
                quantity,
                isAvailable: true
            });
        }

        // Calculate total
        cart.calculateTotal();
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};

// Update item quantity in cart
const updateCartItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { menuItemId, quantity } = req.body;

        if (!menuItemId || quantity == null || typeof quantity !== 'number' || isNaN(quantity)) {
            return res.status(400).json({ 
                error: 'Menu item ID and a valid quantity are required' 
            });
        }

        if (quantity < 0) {
            return res.status(400).json({ error: 'Quantity cannot be negative' });
        }

        const cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.menuItemId === menuItemId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        // If cart is empty, delete it
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ message: 'Cart is now empty' });
        }

        cart.calculateTotal();
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { menuItemId } = req.body;

        if (!menuItemId) {
            return res.status(400).json({ error: 'Menu item ID is required' });
        }

        const cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.menuItemId !== menuItemId);

        // If cart is empty, delete it
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ message: 'Cart is now empty' });
        }

        cart.calculateTotal();
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const userId = req.userId;

        const result = await Cart.deleteOne({ userId, status: 'active' });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'No active cart found' });
        }

        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};

// Checkout - convert cart to order
const checkout = async (req, res) => {
    try {
        const userId = req.userId;

        const cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate restaurant still exists (optional - can call restaurant-service)
        // For now, we trust the cart data

        // Create order from cart
        const newOrder = new Order({
            userId,
            restaurantId: cart.restaurantId,
            items: cart.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: cart.totalAmount,
            paymentStatus: 'pending',
            deliveryStatus: 'pending'
        });

        await newOrder.save();

        // Mark cart as ordered
        cart.status = 'ordered';
        await cart.save();

        // Produce Kafka event
        await produceEvent('order_created', {
            orderId: newOrder._id,
            userId,
            restaurantId: cart.restaurantId,
            items: cart.items,
            totalAmount: cart.totalAmount,
            status: 'created'
        });

        res.status(201).json({
            message: 'Order placed successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'Failed to complete checkout' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout
};
