const express=require('express');
const {addRestaurant, getRestaurants, getRestaurantById, updateRestaurantRating}=require('../controllers/restaurant.controller');

const router=express.Router();

router.post('/add',addRestaurant);

router.get('/',getRestaurants);

router.get('/:id', getRestaurantById);

// PUT - Update restaurant rating (called by order-service)
router.put('/:restaurantId/rating', updateRestaurantRating);

module.exports=router;