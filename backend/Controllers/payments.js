const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
require("dotenv").config();

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

exports.processPayment = async (req, res) => {
  try {
    const { amount, mobileWalletNumber, description } = req.body;

    if (!amount || !mobileWalletNumber || !description) {
      console.error("Missing required fields:", req.body);
      return res.status(400).json({ error: "Missing required fields." });
    }

    console.log("Initiating payment with mobileWalletNumber:", mobileWalletNumber);
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mchTransactionRef: shortUUID.generate(),
      mobileWalletNumber,
    });

    if (transaction.refresh) {
      await transaction.refresh();
    }

    console.log("Transaction response:", JSON.stringify(transaction, null, 2));

    const status = transaction.data ? transaction.data.status : null;
    const transactionId = transaction.data
      ? transaction.data.transactionId || transaction.data.requestId
      : null;

    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log("Transaction fully successful. Transaction ID:", transactionId);

      return res.status(200).json({
        message: "Payment processed successfully.",
        transactionId: transactionId,
      });
    } else if (status === "PAYMENT_IN_PROGRESS") {
      console.log("Payment is still in progress. Transaction ID:", transactionId);
      return res.status(202).json({
        message: "Payment is in progress. Please wait for completion.",
        transactionId: transactionId,
      });
    } else {
      console.log("Fallback redirection for transaction. Status:", status);
      return res.status(500).json({ error: "Unexpected payment status." });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

exports.tranzakWebhook = async (req, res) => {
  try {
    console.log("Received Tranzak webhook payload:", JSON.stringify(req.body, null, 2));

    const { resource } = req.body;
    if (!resource || !resource.requestId) {
      console.error("Invalid webhook payload:", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const transactionId = resource.requestId;

    if (resource.status === "COMPLETED" || resource.status === "SUCCESSFUL") {
      console.log("Transaction completed successfully. Transaction ID:", transactionId);
    } else if (resource.status === "PAYMENT_IN_PROGRESS") {
      console.log("Payment is still in progress for transaction:", transactionId);
    } else {
      console.log("Received unsupported transaction status:", resource.status);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};