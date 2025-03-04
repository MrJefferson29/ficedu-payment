const tranzak = require('tranzak-node').default;
require('dotenv').config();
const express = require('express');

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || 'sandbox',
});

// Handle incoming webhook requests
exports.handleTranzakWebhook = async (req, res) => {
  try {
    const eventData = req.body;
    console.log('🔔 Webhook received:', eventData);

    // Ensure the webhook functionality exists
    if (!client.webhook || typeof client.webhook.process !== 'function') {
      console.error('Webhook processing is not available on the client instance.');
      return res.status(500).json({ error: 'Webhook processing not supported.' });
    }

    // Validate and process webhook
    const isValid = await client.webhook.process(eventData);

    if (!isValid) {
      console.warn('⚠️ Invalid webhook event detected');
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    if (eventData.event === 'payment.collection.completed') {
      console.log('✅ Payment successful:', eventData.data.requestId);
      // Process success logic (e.g., update database)
    } else if (eventData.event === 'payment.collection.canceled') {
      console.log('❌ Payment canceled:', eventData.data.requestId);
      // Handle failure case
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❗ Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};
