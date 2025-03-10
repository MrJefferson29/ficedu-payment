const express = require("express");
const { processPayment, webhookHandler } = require("../Controllers/payments");

const router = express.Router();

// Payment processing route
router.post("/payment", processPayment);

// Webhook route (Tranzak will send events here)
router.post("/tranzak-webhook", webhookHandler);
router.post("/tranzak-webhook", webhookHandler);


module.exports = router;
