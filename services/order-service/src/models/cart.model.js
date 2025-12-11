const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    menuItemId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    restaurantId: {
        type: String,
        required: true
    },
    restaurantName: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'ordered', 'abandoned'],
        default: 'active'
    }
}, { 
    timestamps: true 
});

// Compound index for finding active cart by user
cartSchema.index({ userId: 1, status: 1 });

// Method to calculate total
cartSchema.methods.calculateTotal = function() {
    this.totalAmount = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    return this.totalAmount;
};

module.exports = mongoose.model('Cart', cartSchema);
