const express = require('express');
const { processPayment, tranzakWebhook } = require('../Controllers/payments');

const router = express.Router();

// Payment processing route
router.post('/payment', processPayment);

// Webhook route (Tranzak will send events here)
router.post("/process/tranzak-webhook", tranzakWebhook);
router.post("/tranzak-webhook", tranzakWebhook);

module.exports = router;
