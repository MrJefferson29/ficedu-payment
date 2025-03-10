const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
require("dotenv").config();

// Initialize the Tranzak client
const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

/**
 * Custom helper to refresh transaction status.
 * Calls the /xp021/v1/request/refresh-transaction-status endpoint.
 */
const refreshTransactionStatus = async (requestId) => {
  try {
    // If the client library does not expose a dedicated method,
    // we assume that it provides a generic "request" method.
    // If not, you can use a library like axios here.
    const response = await client.request({
      method: "POST",
      url: "/xp021/v1/request/refresh-transaction-status",
      data: { requestId },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

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
      mchTransactionRef: shortUUID.generate(), // Stable identifier for this transaction
      mobileWalletNumber,
    });

    // Refresh the transaction status if supported
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

// Updated Webhook Handler with Post-Notification Verification
exports.tranzakWebhook = async (req, res) => {
  try {
    const { eventType, resource } = req.body;
    if (!resource || !resource.mchTransactionRef || !resource.requestId) {
      console.error("Invalid webhook payload: missing required fields.", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    
    const stableId = resource.mchTransactionRef;
    const event = eventType.toUpperCase();
    console.log(`Received webhook event: ${event} for transaction ${stableId}`);
    
    if (event === "REQUEST.COMPLETED") {
      // Delay before refreshing to allow final processing
      setTimeout(async () => {
        try {
          const refreshed = await refreshTransactionStatus(resource.requestId);
          const finalStatus = refreshed.data ? refreshed.data.status : null;
          console.log(`Refreshed status for transaction ${stableId}: ${finalStatus}`);
          if (finalStatus === "SUCCESSFUL" || finalStatus === "COMPLETED") {
            console.log(`Final status confirmed for transaction ${stableId}. Transaction ID: ${refreshed.data.transactionId}`);
            // Update your order processing (e.g., update DB, notify customer) here.
          } else {
            console.log(`Transaction ${stableId} still not final. Current status: ${finalStatus}`);
            // Optionally schedule another check or handle as needed.
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
