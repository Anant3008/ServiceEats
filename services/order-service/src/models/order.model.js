const mongoose=require('mongoose');

const orderSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    restaurantId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Restaurant'
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