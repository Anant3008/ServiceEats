const mongoose=require('mongoose');

const orderSchema=new mongoose.Schema({
    userId:{
        type:String,
        required:true,
    },
    restaurantId:{
        type:String,
        required:true,
    },
    items:[{
         name:{
            type:String,
            required:true,
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true
        }
    }],
    totalAmount:{
        type:Number,
        required:true
    },
    paymentStatus:{
        type:String,
        enum:['pending','paid','failed'],
        default:'pending'
    },
    deliveryStatus:{
        type:String,
        enum:['pending','completed','cancelled'],
        default:'pending'
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports=mongoose.model('Order',orderSchema);