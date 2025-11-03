const Restaurant = require('../models/restaurant.model');
const {produceEvent} = require('../kafka/producer');

const addRestaurant = async (req, res) => {
    try {
        const { name, address, cuisine } = req.body;
        if (!name || !address || !cuisine) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const newRestaurant = new Restaurant({ name, address, cuisine });
        await newRestaurant.save();

        await produceEvent('restaurant_added', {
            restaurantId: newRestaurant._id,
            name: newRestaurant.name,
            address: newRestaurant.address,
            cuisine: newRestaurant.cuisine,
        });
        res.status(201).json({ message: 'Restaurant added successfully' });
    } catch (error) {
        console.error('Error adding restaurant:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    addRestaurant,
    getRestaurants,
};