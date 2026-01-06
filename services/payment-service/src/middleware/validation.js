const { body, validationResult } = require('express-validator');

/**
 * Validation rules for POST /payments endpoint
 * Ensures input is valid before hitting controller
 */
const validateCreatePayment = [
    body('orderId')
        .notEmpty()
        .withMessage('orderId is required')
        .isString()
        .withMessage('orderId must be a string'),

    body('userId')
        .notEmpty()
        .withMessage('userId is required')
        .isString()
        .withMessage('userId must be a string'),

    body('amount')
        .notEmpty()
        .withMessage('amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('amount must be greater than 0'),

    body('currency')
        .optional()
        .isString()
        .isIn(['inr', 'usd', 'eur'])
        .withMessage('currency must be inr, usd, or eur'),

    body('paymentMethod')
        .optional()
        .isIn(['card', 'upi', 'wallet', 'cod', 'unknown'])
        .withMessage('paymentMethod must be card, upi, wallet, cod, or unknown'),
];

/**
 * Error handler middleware
 * Checks if validation errors exist and returns them
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
    }
    next();
};

module.exports = {
    validateCreatePayment,
    handleValidationErrors,
};
