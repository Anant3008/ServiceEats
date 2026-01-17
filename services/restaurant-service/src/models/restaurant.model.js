const mongoose=require('mongoose');

const restaurantSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    cuisine:{
        type:String,
        required:true,
    },
    imageUrl:{
        type:String,
        default:'',
    },
    rating:{
        type:Number,
        default:0,
    },
    menu:[{
        name:{
            type:String,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        },
        isAvailable:{
            type:Boolean,
            default:true,
        }
    }]
},{timestamps:true});

module.exports=mongoose.model('Restaurant',restaurantSchema);