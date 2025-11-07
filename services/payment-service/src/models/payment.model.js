const mongoose=require('mongoose');

const paymentSchema=new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    orderId:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        enum:['success','failed'],
        required:true
    }
});

module.exports=mongoose.model('Payment',paymentSchema);