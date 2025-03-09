// paymentController.js
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

    // Initiate the mobile money payment via Tranzak
    console.log("Initiating payment with mobileWalletNumber:", mobileWalletNumber);
    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mchTransactionRef: shortUUID.generate(), // Stable identifier for this transaction
      mobileWalletNumber,
    });

    // Refresh transaction status if available
    if (transaction.refresh) {
      await transaction.refresh();
    }

    // Log the full transaction response for debugging
    console.log("Transaction response:", JSON.stringify(transaction, null, 2));

    // Extract useful fields from the response
    const status = transaction.data ? transaction.data.status : null;
    const transactionId = transaction.data
      ? transaction.data.transactionId || transaction.data.requestId
      : null;

    // Successful Payment Flow
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log("Transaction fully successful. Transaction ID:", transactionId);
      return res.status(200).json({
        message: "Payment processed successfully.",
        transactionId,
      });
    } else if (status === "PAYMENT_IN_PROGRESS") {
      console.log("Payment is still in progress. Transaction ID:", transactionId);
      // Initiate a web redirection flow to obtain the payment URL
      const webTransaction = await client.payment.collection.simple.chargeByWebRedirect({
        mchTransactionRef: shortUUID.generate(),
        amount,
        currencyCode: "XAF",
        description,
      });

      if (
        !webTransaction ||
        !webTransaction.data ||
        !webTransaction.data.links ||
        !webTransaction.data.links.paymentAuthUrl
      ) {
        console.error("Web Transaction response missing payment URL:", webTransaction);
        return res.status(202).json({
          message: "Payment is in progress. Please wait for completion.",
          transactionId,
        });
      }

      return res.status(202).json({
        message: "Redirect user to complete payment.",
        transactionId,
        paymentUrl: webTransaction.data.links.paymentAuthUrl,
      });
    } else {
      // Fallback: attempt web redirection for other statuses
      console.log("Fallback redirection for transaction. Status:", status);
      const webTransaction = await client.payment.collection.simple.chargeByWebRedirect({
        mchTransactionRef: shortUUID.generate(),
        amount,
        currencyCode: "XAF",
        description,
      });

      if (
        !webTransaction ||
        !webTransaction.data ||
        !webTransaction.data.links ||
        !webTransaction.data.links.paymentAuthUrl
      ) {
        console.error("Fallback web Transaction response missing payment URL:", webTransaction);
        return res.status(500).json({ error: "Payment redirection failed." });
      }

      return res.status(202).json({
        message: "Redirect user to complete payment.",
        paymentUrl: webTransaction.data.links.paymentAuthUrl,
      });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

exports.tranzakWebhook = async (req, res) => {
  try {
    const { eventType, resource } = req.body;
    if (!resource || !resource.mchTransactionRef) {
      console.error("Invalid webhook payload: missing resource.mchTransactionRef");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    
    const stableId = resource.mchTransactionRef; // Stable identifier for the transaction
    const event = eventType.toUpperCase();
    
    // Log events based on type
    if (event === "REQUEST.COMPLETED" && resource.transactionId) {
      console.log(`Transaction with stable id ${stableId} completed successfully. Transaction ID: ${resource.transactionId}`);
    } else if (event === "REQUEST.INITIATED") {
      console.log(`Transaction with stable id ${stableId} initiated.`);
    } else {
      console.log(`Received event ${event} for transaction stable id ${stableId}`);
    }
    
    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};
