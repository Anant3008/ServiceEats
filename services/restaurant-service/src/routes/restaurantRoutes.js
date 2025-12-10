const express=require('express');
const {addRestaurant,getRestaurants, getRestaurantById}=require('../controllers/restaurant.controller');

const router=express.Router();

router.post('/add',addRestaurant);

router.get('/',getRestaurants);

router.get('/:id', getRestaurantById);

module.exports=router;