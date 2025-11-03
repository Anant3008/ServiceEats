const express=require('express');
const {addRestaurant,getRestaurants}=require('../controllers/restaurant.controller');

const router=express.Router();

router.post('/add',addRestaurant);

router.get('/',getRestaurants);

module.exports=router;