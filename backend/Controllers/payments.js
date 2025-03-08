// paymentController.js
const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const user = require('../Models/user');
const Transaction = require('../Models/transaction'); // New transaction model
require("dotenv").config();

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

exports.processPayment = async (req, res) => {
  try {
    const { amount, mobileWalletNumber, description, email } = req.body;
    if (!amount || !mobileWalletNumber || !description || !email) {
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
      mchTransactionRef: shortUUID.generate(),
      mobileWalletNumber,
    });

    // Optionally refresh the transaction status if available
    if (transaction.refresh) {
      await transaction.refresh();
    }
    console.log("Transaction response:", JSON.stringify(transaction, null, 2));

    // Extract relevant fields from the response
    const status = transaction.data ? transaction.data.status : null;
    const transactionId = transaction.data
      ? transaction.data.transactionId || transaction.data.requestId
      : null;

    // Save the transaction info in the database for later reference
    await Transaction.create({
      transactionId,
      email, // Store the user's email
      amount,
      status,
      initiatedAt: new Date(),
    });

    // If payment is completed, process any additional fund transfers
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log("Transaction fully successful. Transaction ID:", transactionId);
      // ... (handle transfers as before)
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
      // Fallback for other statuses using a web redirection
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
    console.log("Received Tranzak webhook payload:", JSON.stringify(req.body, null, 2));

    const { eventType, resource } = req.body;
    if (!resource || !resource.requestId) {
      console.error("Invalid webhook payload: missing resource.requestId", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const transactionId = resource.requestId;
    const event = eventType.toUpperCase(); // Normalize case for safety

    if (event === "REQUEST.INITIATED") {
      console.log("Transaction initiated. Transaction ID:", transactionId);
      // Optionally update transaction status in DB if needed
    } else if (event === "REQUEST.COMPLETED") {
      console.log("Transaction completed successfully. Transaction ID:", transactionId);

      // Update the transaction record in the database
      const txn = await Transaction.findOneAndUpdate(
        { transactionId },
        { status: "COMPLETED", completedAt: new Date() },
        { new: true }
      );

      if (!txn) {
        console.warn("Transaction record not found for ID:", transactionId);
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.email) {
        // Ensure we don’t update already paid users unnecessarily
        const updatedUser = await User.findOneAndUpdate(
          { email: txn.email, paid: false },
          { paid: true },
          { new: true }
        );

        if (updatedUser) {
          console.log(`User ${txn.email} payment status updated to PAID.`);
        } else {
          console.warn(`User with email ${txn.email} not found or already paid.`);
        }
      } else {
        console.warn("Transaction email missing. Cannot update user status.");
      }
    } else {
      console.log("Unhandled event type:", event, "for transaction:", transactionId);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};
