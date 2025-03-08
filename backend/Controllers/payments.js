const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const User = require("../Models/user");
require("dotenv").config();

// Check for required Tranzak credentials
if (!process.env.TRANZAK_APP_ID || !process.env.TRANZAK_APP_KEY) {
  console.error("❌ Missing Tranzak credentials in environment variables.");
  process.exit(1);
}

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

/**
 * Process Payment
 * - Validates incoming payment details.
 * - Searches for the user by email.
 * - Generates a unique transaction reference.
 * - Initiates the mobile money payment using the Tranzak API.
 * - Returns the redirect URL to the frontend.
 */
exports.processPayment = async (req, res) => {
  try {
    const { amount, mobileWalletNumber, description, email } = req.body;
    // Validate required fields
    if (!amount || !mobileWalletNumber || !description || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Find the user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    // Generate a unique transaction reference
    const mchTransactionRef = shortUUID.generate();
    user.mchTransactionRef = mchTransactionRef;
    user.amount = amount;
    user.paid = false;
    await user.save();
    console.log(`✅ Stored mchTransactionRef (${mchTransactionRef}) for user: ${email}`);

    // Initiate the payment request via Tranzak API.
    // Adjust the payload as per the Tranzak API documentation.
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      mchTransactionRef,
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mobileWalletNumber,
      callbackUrl: `${process.env.BACKEND_URL}/tranzak/webhook`, // URL to receive webhook notifications
      returnUrl: `${process.env.FRONTEND_URL}/payment-success`, // URL to redirect after payment
    });

    // Ensure transaction data is returned
    if (!transaction || !transaction.data) {
      console.error("❌ Payment initiation failed:", transaction);
      return res.status(500).json({ error: "Payment initiation failed." });
    }

    const { data } = transaction;
    const redirectUrl = data?.redirectUrl;
    const transactionId = data?.transactionId || data?.requestId || "UNKNOWN_TRANSACTION_ID";

    if (!redirectUrl) {
      console.error("❌ No redirect URL received from Tranzak.");
      return res.status(500).json({ error: "No redirect URL received from Tranzak." });
    }

    // Return the details to the frontend (redirect URL, transaction reference, etc.)
    return res.status(200).json({
      message: "Payment initiated successfully.",
      transactionId,
      mchTransactionRef,
      redirectUrl,
    });
  } catch (error) {
    console.error("🚨 Payment processing error:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

/**
 * Tranzak Webhook
 * - Handles the callback from Tranzak after the payment is processed.
 * - Checks that the payload contains the required details.
 * - Finds the user by the transaction reference and, if payment is successful, updates their paid status.
 */
exports.tranzakWebhook = async (req, res) => {
  try {
    console.log("📩 Received Webhook:", JSON.stringify(req.body, null, 2));

    const { resource } = req.body;
    // Validate the webhook payload
    if (!resource?.requestId || !resource?.mchTransactionRef) {
      console.error("❌ Invalid webhook payload: missing transaction details.");
      return res.status(400).json({ error: "Invalid webhook payload." });
    }

    const transactionId = resource.transactionId || resource.requestId;
    const mchTransactionRef = resource.mchTransactionRef;
    const status = resource.status;
    console.log(`📩 Webhook Received - mchTransactionRef: ${mchTransactionRef}, status: ${status}`);

    // Locate the user in the database by the transaction reference
    const user = await User.findOne({ mchTransactionRef });
    if (!user) {
      console.error(`❌ No user found for mchTransactionRef: ${mchTransactionRef}`);
      return res.status(404).json({ error: "User not found for transaction." });
    }

    // Prevent duplicate processing
    if (user.paid) {
      console.log(`✅ Transaction ${transactionId} already processed for user ${user.email}.`);
      return res.status(200).json({ message: "Transaction already processed." });
    }

    // If the payment status indicates success, update the user's record
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      user.paid = true;
      user.transactionId = transactionId;
      await user.save();
      console.log(`✅ Webhook: User ${user.email} marked as paid.`);
      return res.status(200).json({ message: "Payment confirmed successfully." });
    }

    console.log("⚠️ Payment not successful yet. Current status:", status);
    return res.status(200).json({ message: "Payment not successful yet." });
  } catch (error) {
    console.error("🚨 Webhook processing error:", error);
    return res.sendStatus(500);
  }
};
