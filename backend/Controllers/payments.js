// paymentController.js
const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const User = require('../Models/user');
const Transaction = require('../Models/transaction');
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

    // Generate a stable reference for the transaction
    const mchTransactionRef = shortUUID.generate();
    console.log("Initiating payment with mobileWalletNumber:", mobileWalletNumber);

    const transactionResponse = await client.payment.collection.simple.chargeMobileMoney({
      amount,
      currencyCode: "XAF",
      description,
      payerNote: description,
      mchTransactionRef, // pass the stable reference here
      mobileWalletNumber,
    });

    // Optionally refresh the transaction status if available
    if (transactionResponse.refresh) {
      await transactionResponse.refresh();
    }
    console.log("Transaction response:", JSON.stringify(transactionResponse, null, 2));

    // Extract relevant fields from the response
    const status = transactionResponse.data ? transactionResponse.data.status : null;
    // Use the stable mchTransactionRef as the transaction identifier, 
    // or fallback to requestId if needed
    const transactionId = mchTransactionRef;

    if (!transactionId) {
      console.error("No transaction ID received from Tranzak.");
      return res.status(500).json({ error: "No transaction ID received." });
    }

    // Save the transaction info in the database for later reference.
    await Transaction.create({
      transactionId,            // using the stable mchTransactionRef
      originalRequestId: transactionResponse.data.requestId, // optionally store the original requestId
      email, // store the user's email for later update
      amount,
      status: (status === "SUCCESSFUL" || status === "COMPLETED") ? status : "PAYMENT_IN_PROGRESS",
      initiatedAt: new Date(),
    });
    console.log(`Transaction record created for ID: ${transactionId} with email: ${email}`);

    // Handle the different statuses returned by Tranzak.
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
    
    // Make sure the payload contains the stable reference.
    if (!resource || !resource.mchTransactionRef) {
      console.error("Invalid webhook payload: missing resource.mchTransactionRef", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    
    // Use the stable mchTransactionRef for matching.
    const stableId = resource.mchTransactionRef;
    const event = eventType.toUpperCase();
    
    // Find the transaction record by the stable identifier.
    const txn = await Transaction.findOne({ transactionId: stableId });
    if (!txn) {
      console.warn("Transaction record not found for stable ID:", stableId);
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    // Idempotency: If the transaction is already marked as COMPLETED, ignore subsequent events.
    if (txn.status === "COMPLETED") {
      console.log(`Transaction ${stableId} is already completed. Ignoring duplicate webhook.`);
      return res.sendStatus(200);
    }
    
    // Distinguish between different phases.
    // For example, if you can determine that this webhook represents final confirmation,
    // you may check for additional fields, a delay between events, or compare the transactionId
    // provided by Tranzak.
    if (event === "REQUEST.COMPLETED") {
      // Here, add any additional checks if needed to determine that the payment is truly final.
      // For example, you could check if resource.transactionId exists and has a valid value.
      if (resource.transactionId) {
        console.log("Final confirmation received. Transaction stable ID:", stableId);
        
        // Update the transaction status to COMPLETED.
        txn.status = "COMPLETED";
        txn.completedAt = new Date();
        await txn.save();
        
        // Update the user's paid status if not already updated.
        if (txn.email) {
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
        // If there isn’t enough data to conclude final confirmation,
        // log and ignore the event.
        console.log("Webhook received for REQUEST.COMPLETED but no transactionId provided. Ignoring.");
      }
    } else if (event === "REQUEST.INITIATED") {
      console.log("Received initiation webhook. Transaction stable ID:", stableId);
      // Optionally update the transaction record to note that initiation was confirmed.
      // Do not update the user's paid status here.
    } else {
      console.log("Unhandled event type:", event, "for transaction stable ID:", stableId);
    }
    
    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};
