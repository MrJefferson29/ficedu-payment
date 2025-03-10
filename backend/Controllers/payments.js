const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
require("dotenv").config();

// Initialize the Tranzak client
const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

// Process Payment Function (for context)
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
      mchTransactionRef: shortUUID.generate(), // Custom stable reference
      mobileWalletNumber,
    });

    // If the transaction object supports refresh, update its status.
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
        transactionId,
      });
    } else if (status === "PAYMENT_IN_PROGRESS") {
      console.log("Payment is still in progress. Transaction ID:", transactionId);
      // Initiate a web redirection flow for additional payer authentication
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

// Updated Webhook Handler with Post-Notification Verification
exports.tranzakWebhook = async (req, res) => {
  try {
    const { eventType, resource } = req.body;
    // Ensure required fields exist (we need both the custom transaction reference and the requestId)
    if (!resource || !resource.mchTransactionRef || !resource.requestId) {
      console.error("Invalid webhook payload: missing required fields.", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const stableId = resource.mchTransactionRef; // our custom transaction identifier
    const event = eventType.toUpperCase();
    console.log(`Received webhook event: ${event} for transaction ${stableId}`);

    if (event === "REQUEST.COMPLETED") {
      // Instead of immediately updating order status, wait a short time and then refresh the transaction status.
      setTimeout(async () => {
        try {
          // Refresh the transaction status via an API call.
          // (Assuming that the client exposes a method refreshTransactionStatus which calls the
          // /xp021/v1/request/refresh-transaction-status endpoint.)
          const refreshed = await client.payment.request.refreshTransactionStatus({
            requestId: resource.requestId,
          });
          const finalStatus = refreshed.data.status;
          console.log(`Refreshed status for transaction ${stableId}: ${finalStatus}`);
          if (finalStatus === "SUCCESSFUL" || finalStatus === "COMPLETED") {
            console.log(`Final status confirmed for transaction ${stableId}. Transaction ID: ${refreshed.data.transactionId}`);
            // Here you would update your database or trigger further order processing.
          } else {
            console.log(`Transaction ${stableId} still not final. Current status: ${finalStatus}`);
            // Optionally, you could schedule another check or handle as needed.
          }
        } catch (err) {
          console.error(`Error refreshing transaction ${stableId}:`, err);
        }
      }, 10000); // 10-second delay

      return res.sendStatus(200);
    } else if (event === "REQUEST.INITIATED") {
      console.log(`Transaction ${stableId} initiated.`);
      return res.sendStatus(200);
    } else {
      console.log(`Received unhandled event type: ${event} for transaction ${stableId}`);
      return res.sendStatus(200);
    }
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};
