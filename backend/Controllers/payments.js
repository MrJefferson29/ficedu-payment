const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const User = require("../Models/user");
require("dotenv").config();

if (!process.env.TRANZAK_APP_ID || !process.env.TRANZAK_APP_KEY) {
  console.error("❌ Missing Tranzak credentials in environment variables.");
  process.exit(1);
}

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

// 🔥 Process Payment
exports.processPayment = async (req, res) => {
  try {
    const { amount, mobileWalletNumber, description, email } = req.body;

    // ✅ Validate Input
    if (!amount || !mobileWalletNumber || !description || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // ✅ Verify User Exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    // ✅ Generate Unique Reference for this transaction
    const mchTransactionRef = shortUUID.generate();

    // ✅ Store Transaction Reference & Amount in User BEFORE Initiating Payment
    user.mchTransactionRef = mchTransactionRef;
    user.amount = amount;
    user.paid = false; // paid status remains false until the webhook confirms payment
    await user.save();

    console.log(`✅ Stored mchTransactionRef (${mchTransactionRef}) for user: ${email}`);

    // 🔥 Initiate Mobile Money Payment
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      mchTransactionRef, // use the stored reference
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mobileWalletNumber,
    });

    if (!transaction || !transaction.data) {
      console.error("❌ Payment initiation failed:", transaction);
      return res.status(500).json({ error: "Payment initiation failed." });
    }

    // ✅ Extract Transaction Info
    const { data } = transaction;
    const transactionId = data?.transactionId || data?.requestId || "UNKNOWN_TRANSACTION_ID";
    const status = data?.status;

    console.log("⏳ Payment in progress. Transaction ID:", transactionId);

    // ✅ If status is PAYMENT_IN_PROGRESS, simply return a response telling the client that payment is in progress.
    if (status === "PAYMENT_IN_PROGRESS") {
      console.log("⏳ Payment is in progress. Awaiting user completion on mobile wallet.");
      return res.status(200).json({
        message: "Payment initiated. Please complete the payment in your mobile wallet. Your payment will be confirmed shortly.",
        transactionId,
        mchTransactionRef,
      });
    }

    // For any other status, return a generic response.
    return res.status(200).json({
      message: "Payment initiated successfully. Awaiting webhook confirmation.",
      transactionId,
      mchTransactionRef,
    });
  } catch (error) {
    console.error("🚨 Payment processing error:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

// 🔥 Tranzak Webhook - Update Paid Status Only After Payment Completion
exports.tranzakWebhook = async (req, res) => {
  try {
    console.log("📩 Received Webhook:", JSON.stringify(req.body, null, 2));

    const { resource } = req.body;
    if (!resource?.requestId || !resource?.mchTransactionRef) {
      console.error("❌ Invalid webhook payload: missing transaction details.");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // ✅ Extract Transaction Details
    const transactionId = resource.transactionId || resource.requestId;
    const mchTransactionRef = resource.mchTransactionRef;
    const status = resource.status;

    console.log(`📩 Webhook Received - mchTransactionRef: ${mchTransactionRef}`);

    // ✅ Find User by mchTransactionRef
    const user = await User.findOne({ mchTransactionRef });

    if (!user) {
      console.error(`❌ No user found for mchTransactionRef: ${mchTransactionRef}`);
      return res.status(404).json({ error: "User not found for transaction." });
    }

    console.log(`📩 Database Stored - User: ${user.email}, mchTransactionRef: ${user.mchTransactionRef}`);

    if (user.paid) {
      console.log(`✅ Transaction ${transactionId} already processed.`);
      return res.status(200).json({ message: "Transaction already processed" });
    }

    // ✅ Process Successful Payment only after webhook confirms completion
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      user.paid = true;
      user.transactionId = transactionId;
      await user.save();

      console.log(`✅ Webhook: User ${user.email} marked as paid.`);
      return res.status(200).json({ message: "Payment confirmed successfully." });
    }

    console.log("⚠️ Webhook received non-success status:", status);
    return res.status(200).json({ message: "Payment not successful yet." });
  } catch (error) {
    console.error("🚨 Webhook processing error:", error);
    return res.sendStatus(500);
  }
};
