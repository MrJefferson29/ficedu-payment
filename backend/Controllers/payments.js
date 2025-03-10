// paymentController.js
const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
require("dotenv").config();

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

// Global in-memory counter for tracking webhooks per transaction.
// In production, consider a persistent store if needed.
const webhookCount = {};

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
      mchTransactionRef: shortUUID.generate(),
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

      // Optional fund transfers if merchant info is provided
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

      return res.status(200).json({
        message: "Payment processed successfully.",
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
    // Log full webhook payload for debugging
    console.log("Received Tranzak webhook payload:", JSON.stringify(req.body, null, 2));

    const { data } = req.body;
    if (!data || !data.requestId) {
      console.error("Invalid webhook payload:", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const transactionId = data.requestId;

    // Update the webhook count for this transaction.
    if (!webhookCount[transactionId]) {
      webhookCount[transactionId] = 1;
    } else {
      webhookCount[transactionId]++;
    }

    // Log "Hello Big World" only if this is the second webhook and its status is COMPLETED.
    if (webhookCount[transactionId] === 2 && data.status === "COMPLETED") {
      console.log("Hello Big World");
    }

    // Process transaction status based on the webhook payload.
    switch (data.status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        console.log("Transaction completed successfully. Transaction ID:", transactionId);
        // Update server records here if needed.
        break;

      case "PAYMENT_IN_PROGRESS":
        console.log("Payment is still in progress for transaction:", transactionId);
        // Optionally notify or log that the payment is in progress.
        break;

      default:
        console.log("Received unsupported transaction status:", data.status);
        break;
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};
