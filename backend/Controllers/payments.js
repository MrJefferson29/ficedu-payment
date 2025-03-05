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

    // ✅ Validate Input First
    if (!amount || !mobileWalletNumber || !description || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // ✅ Verify User Exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    // ✅ Generate Unique Reference BEFORE Using It
    const mchTransactionRef = shortUUID.generate();

    // ✅ Store Transaction Reference & Amount in User BEFORE Initiating Payment
    user.mchTransactionRef = mchTransactionRef;
    user.amount = amount;
    user.paid = false; // Reset payment status before initiating a new transaction
    await user.save();

    console.log(`✅ Stored mchTransactionRef (${mchTransactionRef}) for user: ${email}`);

    // 🔥 Initiate Mobile Money Payment
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      mchTransactionRef, // ✅ Use stored reference
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

    // ✅ Successful Payment Flow
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log("✅ Transaction successful. Transaction ID:", transactionId);

      user.paid = true;
      user.transactionId = transactionId;
      await user.save();

      return res.status(200).json({
        message: "Payment successful.",
        transactionId,
      });
    }

    // 🔄 Handle Payment in Progress
    if (status === "PAYMENT_IN_PROGRESS") {
      console.log("⏳ Payment still in progress. Redirecting user...");

      const webTransaction = await client.payment.collection.simple.chargeByWebRedirect({
        mchTransactionRef, // ✅ Use same stored reference
        amount,
        currencyCode: "XAF",
        description,
      });

      if (webTransaction?.data?.links?.paymentAuthUrl) {
        return res.status(202).json({
          message: "Redirect user to complete payment.",
          transactionId,
          paymentUrl: webTransaction.data.links.paymentAuthUrl,
        });
      }

      return res.status(202).json({
        message: "Payment is in progress.",
        transactionId,
      });
    }

    return res.status(500).json({ error: "Unexpected payment status." });
  } catch (error) {
    console.error("🚨 Payment processing error:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

// 🔥 Tranzak Webhook - Enhanced Validation
exports.tranzakWebhook = async (req, res) => {
  try {
    console.log("📩 Received Webhook:", JSON.stringify(req.body, null, 2));

    const { resource } = req.body;
    if (!resource?.requestId) {
      console.error("❌ Invalid webhook payload: missing requestId.");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // ✅ Extract Transaction Details
    const transactionId = resource.transactionId || resource.requestId;
    const mchTransactionRef = resource.mchTransactionRef;

    if (!mchTransactionRef) {
      console.error(
        "❌ Missing transaction reference in webhook data:",
        resource
      );
      return res.status(400).json({ error: "Invalid webhook payload: missing mchTransactionRef" });
    }

    // ✅ Find User by `mchTransactionRef`
    const user = await User.findOne({ mchTransactionRef });

    console.log(`📩 Webhook Received - mchTransactionRef: ${mchTransactionRef}`);
    if (user) {
      console.log(`📩 Database Stored - User: ${user.email}, mchTransactionRef: ${user.mchTransactionRef}`);
    }

    if (!user) {
      console.error(
        `❌ No user found for mchTransactionRef: ${mchTransactionRef}`
      );
      return res.status(404).json({ error: "User not found for transaction." });
    }

    if (user.paid) {
      console.log(`✅ Transaction ${transactionId} already processed.`);
      return res.status(200).json({ message: "Transaction already processed" });
    }

    // ✅ Process Successful Payments
    if (resource.status === "SUCCESSFUL" || resource.status === "COMPLETED") {
      user.paid = true;
      user.transactionId = transactionId;
      await user.save();

      console.log(`✅ Webhook: User ${user.email} marked as paid.`);
    } else {
      console.log("⚠️ Webhook received non-success status:", resource.status);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("🚨 Webhook processing error:", error);
    return res.sendStatus(500);
  }
};
