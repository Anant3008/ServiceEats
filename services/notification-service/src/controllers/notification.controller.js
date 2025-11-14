const Notification=require('../models/notification.model');

const getAllNotifications=async(req,res)=>{
    try{
        const notifications=await Notification.find();
        res.status(200).json(notifications);
    }catch(error){
        console.error('Error fetching notifications:',error);
        res.status(500).json({error:'Internal server error'});
    }
};

const getNotificationsByUserId=async(req,res)=>{
    try{
        const userId=req.params.userId;
        const notifications=await Notification.find({userId});
        res.status(200).json(notifications);
    }catch(error){
        console.error('Error fetching notifications by user:',error);
        res.status(500).json({error:'Internal server error'});
    }
};

module.exports={getAllNotifications,getNotificationsByUserId};