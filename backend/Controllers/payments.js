const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const User = require("../Models/user");
require("dotenv").config();

if (!process.env.TRANZAK_APP_ID || !process.env.TRANZAK_APP_KEY) {
  console.error("❌ Missing Tranzak credentials in environment variables.");
  process.exit(1); // Terminate the process if env variables are missing
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
      return res.status(500).json({ error: "Payment initiation failed." });
    }

    // ✅ Extract Transaction Info
    const { status, transactionId, requestId, merchant } = transaction.data;

    // ✅ Successful Payment Flow
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log("✅ Transaction successful. Transaction ID:", transactionId);

      if (merchant) {
        try {
          const accounts = await client.account.list();
          const collectionAccount = accounts.find(
            (acc) => acc.data.accountId === merchant.accountId
          );

          if (collectionAccount) {
            const transferAmount = amount * 0.93;

            await client.payment.transfer.simple.toPayoutAccount({
              amount: transferAmount,
              currencyCode: "XAF",
              customTransactionRef: shortUUID.generate(),
              description: "For payouts",
              payeeNote: "For payouts.",
              fundingAccountId: collectionAccount.data.accountId,
            });

            await client.payment.transfer.simple.toMobileMoney({
              payeeAccountId: mobileWalletNumber,
              amount: transferAmount,
              currencyCode: "XAF",
              customTransactionRef: shortUUID.generate(),
              description: "Procurement of materials",
              payeeNote: "Procurement of materials",
            });
          }
        } catch (transferError) {
          console.error("⚠️ Error transferring funds:", transferError);
          return res.status(500).json({ error: "Fund transfer failed." });
        }
      }

      await User.findByIdAndUpdate(user._id, { paid: true }, { new: true });

      return res.status(200).json({
        message: "Payment successful.",
        transactionId,
      });
    }

    // 🔄 Handle Payment in Progress
    if (status === "PAYMENT_IN_PROGRESS") {
      console.log("⏳ Payment in progress. Transaction ID:", transactionId);
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

    // 🔄 Fallback Redirection for Other Statuses
    console.log("⚠️ Fallback redirection. Status:", status);
    const webTransaction = await client.payment.collection.simple.chargeByWebRedirect({
      mchTransactionRef: shortUUID.generate(),
      amount,
      currencyCode: "XAF",
      description,
    });

    if (webTransaction?.data?.links?.paymentAuthUrl) {
      return res.status(202).json({
        message: "Redirect user to complete payment.",
        paymentUrl: webTransaction.data.links.paymentAuthUrl,
      });
    }

    return res.status(500).json({ error: "Payment redirection failed." });
  } catch (error) {
    console.error("🚨 Payment processing error:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

// 🔥 Tranzak Webhook
exports.tranzakWebhook = async (req, res) => {
  try {
    console.log("📩 Received Webhook:", JSON.stringify(req.body, null, 2));

    const { data } = req.body;
    if (!data?.requestId) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // ✅ Ensure Transaction is Not Already Processed
    const existingUser = await User.findOne({ transactionId: data.requestId });
    if (existingUser?.paid) {
      return res.status(200).json({ message: "Transaction already processed" });
    }

    // ✅ Process Successful Payments
    if (data.status === "SUCCESSFUL" || data.status === "COMPLETED") {
      const updatedUser = await User.findOneAndUpdate(
        { phone: data.mobileWalletNumber },
        { paid: true, transactionId: data.requestId },
        { new: true }
      );

      if (updatedUser) {
        console.log(`✅ Webhook: User ${updatedUser.email} marked as paid.`);
      } else {
        console.error("❌ User not found for phone:", data.mobileWalletNumber);
      }
    } else {
      console.log("⚠️ Webhook received non-success status:", data.status);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("🚨 Webhook processing error:", error);
    return res.sendStatus(500);
  }
};
