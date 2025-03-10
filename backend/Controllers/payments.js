require("dotenv").config();
const tranzak = require("tranzak-node").default;

const shortUUID = require("short-uuid");

// Initialize Tranzak Client
const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

// Helper Function for Web Redirection
const initiateWebRedirection = async (amount, description) => {
  try {
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
      throw new Error("Web Transaction response missing payment URL.");
    }

    return webTransaction.data.links.paymentAuthUrl;
  } catch (error) {
    console.error("Error initiating web redirection:", error);
    throw error;
  }
};

// Process Payment Request
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
    const transactionId = transaction.data ? (transaction.data.transactionId || transaction.data.requestId) : null;

    switch (status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        console.log("Transaction successful. Transaction ID:", transactionId);
        return res.status(200).json({
          message: "Payment processed successfully.",
          transactionId,
        });

      case "PAYMENT_IN_PROGRESS":
      case "PAYER_REDIRECT_REQUIRED":
        console.log("Payment requires user redirection. Transaction ID:", transactionId);
        try {
          const paymentUrl = await initiateWebRedirection(amount, description);
          return res.status(202).json({
            message: "Redirect user to complete payment.",
            transactionId,
            paymentUrl,
          });
        } catch (webError) {
          console.error("Web Transaction error:", webError);
          return res.status(500).json({
            error: "Payment redirection failed. Please try again later.",
          });
        }

      case "FAILED":
      case "CANCELLED":
      case "CANCELLED_BY_PAYER":
        console.error(`Payment failed with status: ${status}`);
        return res.status(400).json({
          error: `Payment failed: ${status}. Please try again.`,
        });

      default:
        console.warn(`Unexpected payment status: ${status}`);
        return res.status(202).json({
          message: "Payment is being processed. Check again later.",
          transactionId,
        });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Payment processing failed." });
  }
};

// Handle Webhook Notifications
exports.webhookHandler = async (req, res) => {
  try {
    console.log("Received Webhook Event:", JSON.stringify(req.body, null, 2));
    const { eventType, resource } = req.body;

    if (!resource || !resource.mchTransactionRef) {
      console.error("Invalid webhook data received.");
      return res.status(400).json({ error: "Invalid webhook data." });
    }

    const transactionRef = resource.mchTransactionRef;
    const status = resource.status;

    switch (eventType) {
      case "REQUEST.COMPLETED":
        console.log(`Transaction ${transactionRef} completed successfully.`);
        break;

      case "REQUEST.INITIATED":
        console.log(`Transaction ${transactionRef} has been initiated.`);
        break;

      case "REQUEST.FAILED":
        console.error(`Transaction ${transactionRef} failed.`);
        break;

      default:
        console.warn(`Unknown webhook event: ${eventType}`);
    }

    return res.status(200).json({ message: "Webhook received successfully." });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({ error: "Webhook processing failed." });
  }
};
