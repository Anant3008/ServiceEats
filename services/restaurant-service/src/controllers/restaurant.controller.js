const Restaurant = require('../models/restaurant.model');
const {produceEvent} = require('../kafka/producer');

const addRestaurant = async (req, res) => {
    try {
        const { name, address, cuisine, imageUrl } = req.body;
        if (!name || !address || !cuisine) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const newRestaurant = new Restaurant({ name, address, cuisine, imageUrl });
        await newRestaurant.save();

        await produceEvent('restaurant.added', {
            restaurantId: newRestaurant._id,
            name: newRestaurant.name,
            address: newRestaurant.address,
            cuisine: newRestaurant.cuisine,
            imageUrl: newRestaurant.imageUrl,
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

const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        console.error('Error fetching restaurant by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update restaurant rating (called by order-service)
const updateRestaurantRating = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { rating, totalRatings } = req.body;

        // Validation
        if (rating === undefined || totalRatings === undefined) {
            return res.status(400).json({ message: 'rating and totalRatings are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'rating must be between 1 and 5' });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { rating: rating },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.status(200).json({
            message: 'Restaurant rating updated successfully',
            restaurant
        });
    } catch (error) {
        console.error('Error updating restaurant rating:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    addRestaurant,
    getRestaurants,
    getRestaurantById,
    updateRestaurantRating,
};