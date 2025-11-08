const mongose = require('mongoose');

const deliverySchema = new mongose.Schema({
    orderId: {
        type: mongose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    driverName: {
        type: String,
        default: 'ServiceEats Delivery'
    },
    status: {
        type: String,
        enum: ["assigned", "pickedUp", "delivered", "cancelled"],
        default: 'assigned'
    },
    location: {
        latitude: {
            type: Number,
            default: 0
        },
        longitude: {
            type: Number,
            default: 0
        }
    }
},{timestamps:true});

const Delivery = mongose.model('Delivery', deliverySchema);

module.exports = Delivery;
