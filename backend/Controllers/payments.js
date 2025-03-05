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

    // ✅ Verify User Exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    // 🔥 Generate Unique Reference
    const mchTransactionRef = shortUUID.generate();

    // ✅ Store Transaction Reference & Amount in User BEFORE Initiating Payment
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { mchTransactionRef, amount },
      { new: true }
    );

    if (!updatedUser) {
      console.error("❌ Failed to update user with mchTransactionRef.");
      return res.status(500).json({ error: "Failed to update user transaction reference." });
    }

    console.log(`✅ Stored mchTransactionRef (${mchTransactionRef}) for user: ${email}`);

    // 🔥 Initiate Mobile Money Payment
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mchTransactionRef,
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

      await User.findByIdAndUpdate(user._id, { paid: true, transactionId }, { new: true });

      return res.status(200).json({
        message: "Payment successful.",
        transactionId,
      });
    }

    // 🔄 Handle Payment in Progress
    if (status === "PAYMENT_IN_PROGRESS") {
      console.log("⏳ Payment still in progress. Redirecting user...");

      const webTransaction = await client.payment.collection.simple.chargeByWebRedirect({
        mchTransactionRef: shortUUID.generate(),
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

// 🔥 Tranzak Webhook - Now Uses Email Instead of mchTransactionRef
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
    const amount = resource.amount;
    const mobileWalletNumber = resource.mobileWalletNumber || resource.payer?.accountId || null;

    // ✅ Find User by Email Instead of mchTransactionRef
    const user = await User.findOne({ amount }); // Matching amount since email isn't in webhook
    if (!user) {
      console.error(`❌ No user found for amount: ${amount}`);
      return res.status(404).json({ error: "User not found for transaction." });
    }

    if (user.paid) {
      console.log(`✅ Transaction ${transactionId} already processed.`);
      return res.status(200).json({ message: "Transaction already processed" });
    }

    // ✅ Process Successful Payments
    if (resource.status === "SUCCESSFUL" || resource.status === "COMPLETED") {
      await User.findByIdAndUpdate(user._id, { paid: true, transactionId }, { new: true });
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
