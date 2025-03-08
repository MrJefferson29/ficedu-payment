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

    if (!amount || !mobileWalletNumber || !description || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    const mchTransactionRef = shortUUID.generate();

    user.mchTransactionRef = mchTransactionRef;
    user.amount = amount;
    user.paid = false;
    await user.save();

    console.log(`✅ Stored mchTransactionRef (${mchTransactionRef}) for user: ${email}`);

    // 🔥 Initiate Payment and Get Redirect URL
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      mchTransactionRef,
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mobileWalletNumber,
      callbackUrl: `${process.env.BACKEND_URL}/tranzak/webhook`,
      returnUrl: `${process.env.FRONTEND_URL}/payment-success`, // Redirect after payment
    });

    if (!transaction || !transaction.data) {
      console.error("❌ Payment initiation failed:", transaction);
      return res.status(500).json({ error: "Payment initiation failed." });
    }

    const { data } = transaction;
    const redirectUrl = data?.redirectUrl || null; // Get the payment portal URL
    const transactionId = data?.transactionId || data?.requestId || "UNKNOWN_TRANSACTION_ID";

    if (!redirectUrl) {
      return res.status(500).json({ error: "No redirect URL received from Tranzak." });
    }

    return res.status(200).json({
      message: "Payment initiated successfully.",
      transactionId,
      mchTransactionRef,
      redirectUrl, // ✅ Return this to the frontend for WebView
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
