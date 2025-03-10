const express = require('express');
const { processPayment, tranzakWebhook } = require('../Controllers/payments');

const router = express.Router();

// Payment processing route
router.post('/payment', processPayment);


module.exports = router;
