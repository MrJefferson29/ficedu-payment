// paymentController.js
const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
const User = require("../Models/user"); // Adjust the path if necessary
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
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Verify that the user exists (using email)
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Payment cannot be processed." });
    }

    // Initiate the mobile money payment via Tranzak
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

    // Log the full transaction response for debugging
    console.log("Transaction response:", JSON.stringify(transaction, null, 2));

    // Extract useful fields from the response
    const status = transaction.data ? transaction.data.status : null;
    const transactionId = transaction.data
      ? transaction.data.transactionId || transaction.data.requestId
      : null;

    // If payment is finalized, perform immediate fund transfers and update the user.
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log("Transaction fully successful. Transaction ID:", transactionId);
      
      // (Optional) If merchant information is provided, perform fund transfers.
      if (transaction.data.merchant) {
        let accounts;
        try {
          accounts = await client.account.list();
        } catch (err) {
          console.error("Failed to fetch accounts:", err);
          return res.status(500).json({ error: "Failed to fetch collection accounts." });
        }

        const collectionAccount = accounts.find(
          (acc) => acc.data.accountId === transaction.data.merchant.accountId
        );

        if (!collectionAccount) {
          console.warn("Collection account not found, proceeding without fund transfers.");
        } else {
          // Calculate the transfer amount (deducting a 7% fee)
          const transferAmount = amount * 0.93;
          try {
            // Transfer funds to the payout account
            await client.payment.transfer.simple.toPayoutAccount({
              amount: transferAmount,
              currencyCode: "XAF",
              customTransactionRef: shortUUID.generate(),
              description: "For payouts",
              payeeNote: "For payouts.",
              fundingAccountId: collectionAccount.data.accountId,
            });
  
            // Transfer funds to the mobile money wallet
            await client.payment.transfer.simple.toMobileMoney({
              payeeAccountId: mobileWalletNumber,
              amount: transferAmount,
              currencyCode: "XAF",
              customTransactionRef: shortUUID.generate(),
              description: "Procurement of materials",
              payeeNote: "Procurement of materials",
            });
          } catch (transferError) {
            console.error("Error transferring funds:", transferError);
            return res.status(500).json({ error: "Fund transfer failed." });
          }
        }
      }
      
      // Update the user's paid status
      const updatedUser = await User.findByIdAndUpdate(user._id, { paid: true }, { new: true });
      if (!updatedUser) {
        console.error("User update failed.");
        return res.status(500).json({ error: "Failed to update user payment status." });
      }
      console.log("User's paid status updated successfully:", updatedUser);
  
      return res.status(200).json({
        message: "Payment processed successfully and user status updated.",
        transactionId: transactionId,
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
          transactionId: transactionId,
        });
      }
  
      return res.status(202).json({
        message: "Redirect user to complete payment.",
        transactionId: transactionId,
        paymentUrl: webTransaction.data.links.paymentAuthUrl,
      });
    } else {
      // Fallback: attempt web redirection
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
    console.log("Received Tranzak webhook:", JSON.stringify(req.body, null, 2));

    const { data } = req.body;
    if (!data || !data.requestId) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Security: Ensure webhook comes from Tranzak (implement validation if available)
    const transactionId = data.requestId;

    // Check if the transaction has already been processed (idempotency check)
    const existingUser = await User.findOne({ transactionId });
    if (existingUser && existingUser.paid) {
      console.log(`Transaction ${transactionId} was already processed. Skipping.`);
      return res.status(200).json({ message: "Transaction already processed" });
    }

    // Process only successful payments
    if (data.status === "SUCCESSFUL" || data.status === "COMPLETED") {
      const mobileWalletNumber = data.mobileWalletNumber;

      // Find the user by mobile number or any unique identifier
      const user = await User.findOne({ phone: mobileWalletNumber });
      if (user) {
        user.paid = true;
        user.transactionId = transactionId; // Store transaction ID to prevent duplicates
        await user.save();
        console.log(`User ${user.email} marked as paid via webhook.`);
      } else {
        console.error("User not found for mobileWalletNumber:", mobileWalletNumber);
      }
    } else {
      console.log("Webhook received with status:", data.status);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};