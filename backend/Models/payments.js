// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  redirectTransactionId: { type: String, default: null },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['initiated', 'completed', 'failed'], default: 'initiated' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
