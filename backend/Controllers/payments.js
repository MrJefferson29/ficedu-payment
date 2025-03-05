const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const User = require("../Models/user");
require("dotenv").config();

if (!process.env.TRANZAK_APP_ID || !process.env.TRANZAK_APP_KEY) {
  console.error("❌ Missing Tranzak credentials in environment variables.");
  process.exit(1); // Terminate if credentials are missing
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

    // ✅ Verify User Existence
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    // 🔥 Initiate Mobile Money Payment
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mchTransactionRef: shortUUID.generate(),
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

      // ✅ Update User Payment Status
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

// 🔥 Tranzak Webhook
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
    const mobileWalletNumber = resource.mobileWalletNumber || resource.payer?.accountId || null;

    if (!mobileWalletNumber) {
      console.error("❌ Missing mobile wallet number in webhook data:", resource);
      return res.status(400).json({ error: "Invalid webhook payload: missing mobileWalletNumber" });
    }

    // ✅ Check if Transaction is Already Processed
    const existingUser = await User.findOne({ transactionId });
    if (existingUser?.paid) {
      console.log(`✅ Transaction ${transactionId} already processed.`);
      return res.status(200).json({ message: "Transaction already processed" });
    }

    // ✅ Process Successful Payments
    if (resource.status === "SUCCESSFUL" || resource.status === "COMPLETED") {
      const updatedUser = await User.findOneAndUpdate(
        { phone: mobileWalletNumber },
        { paid: true, transactionId },
        { new: true }
      );

      if (updatedUser) {
        console.log(`✅ Webhook: User ${updatedUser.email} marked as paid.`);
      } else {
        console.error("❌ User not found for phone:", mobileWalletNumber);
      }
    } else {
      console.log("⚠️ Webhook received non-success status:", resource.status);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("🚨 Webhook processing error:", error);
    return res.sendStatus(500);
  }
};
