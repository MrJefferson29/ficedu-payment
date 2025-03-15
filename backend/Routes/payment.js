const express = require('express');
const { processPayment, tranzakWebhook, getPayment } = require('../Controllers/payments');

const router = express.Router();

// Payment processing route
router.post('/payment', processPayment);

// Webhook route (Tranzak will send events here)
router.post('/tranzak-webhook', tranzakWebhook);

router.post('/get-payment', getPayment)


module.exports = router;
