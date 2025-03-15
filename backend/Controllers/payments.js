// paymentController.js
const tranzak = require("tranzak-node").default;
const shortUUID = require("short-uuid");
require("dotenv").config();

const client = new tranzak({
  appId: process.env.TRANZAK_APP_ID,
  appKey: process.env.TRANZAK_APP_KEY,
  mode: process.env.TRANZAK_MODE || "sandbox",
});

// Import the Payment and User models
const Payment = require("../Models/payments");
const User = require("../Models/user");

// Global in-memory counter for tracking webhooks per transaction.
// In production, consider a persistent store if needed.
const webhookCount = {};

function extractRidFromUrl(url) {
  // Parse the payment URL query parameter 'rid'
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("rid");
  } catch (error) {
    console.error("Error parsing payment URL:", error);
    return null;
  }
}

exports.processPayment = async (req, res) => {
  try {
    // Now including email in the request body
    const { description, email, amount = 30000 } = req.body;
    if (!description || !email) {
      console.error("Missing required fields:", req.body);
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Initiate the mobile money payment via Tranzak
    const transaction =
      await client.payment.collection.simple.chargeMobileMoney({
        amount: 30000,
        currencyCode: "XAF",
        description,
        payerNote: description,
        mchTransactionRef: shortUUID.generate(),
        mobileWalletNumber: 237654711169,
      });

    // Refresh transaction status if available
    if (transaction.refresh) {
      await transaction.refresh();
    }

    // Log the full transaction response for debugging
    console.log("Transaction response:", JSON.stringify(transaction, null, 2));

    // Extract useful fields from the response
    const status = transaction.data ? transaction.data.status : null;
    const initialTransactionId = transaction.data
      ? transaction.data.transactionId || transaction.data.requestId
      : null;

    // Create a Payment record in the database to track this payment
    try {
      await Payment.create({
        transactionId: initialTransactionId,
        email,
        amount,
        status: "initiated",
        description,
      });
    } catch (err) {
      console.error("Error creating Payment record:", err);
      // Continue processing even if logging fails
    }

    // Successful Payment Flow
    if (status === "SUCCESSFUL" || status === "COMPLETED") {
      console.log(
        "Transaction fully successful. Transaction ID:",
        initialTransactionId
      );

      // Optional fund transfers if merchant info is provided
      if (transaction.data.merchant) {
        let accounts;
        try {
          accounts = await client.account.list();
        } catch (err) {
          console.error("Failed to fetch accounts:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch collection accounts." });
        }

        const collectionAccount = accounts.find(
          (acc) => acc.data.accountId === transaction.data.merchant.accountId
        );

        if (!collectionAccount) {
          console.warn(
            "Collection account not found, proceeding without fund transfers."
          );
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
        transactionId: initialTransactionId,
      });
    } else if (status === "PAYMENT_IN_PROGRESS") {
      console.log(
        "Payment is still in progress. Transaction ID:",
        initialTransactionId
      );
      // Initiate a web redirection flow to obtain the payment URL
      const webTransaction =
        await client.payment.collection.simple.chargeByWebRedirect({
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
        console.error(
          "Web Transaction response missing payment URL:",
          webTransaction
        );
        return res.status(202).json({
          message: "Payment is in progress. Please wait for completion.",
          transactionId: initialTransactionId,
        });
      }

      const paymentUrl = webTransaction.data.links.paymentAuthUrl;
      // Extract the redirect transaction id from the URL (assuming it is in the "rid" query param)
      const redirectTransactionId = extractRidFromUrl(paymentUrl);

      // Update the Payment record with the redirect transaction id
      if (redirectTransactionId) {
        await Payment.findOneAndUpdate(
          { transactionId: initialTransactionId },
          { redirectTransactionId }
        );
      }

      return res.status(202).json({
        message: "Redirect user to complete payment.",
        transactionId: initialTransactionId,
        paymentUrl,
      });
    } else {
      // Fallback: attempt web redirection for other statuses
      console.log("Fallback redirection for transaction. Status:", status);
      const webTransaction =
        await client.payment.collection.simple.chargeByWebRedirect({
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
        console.error(
          "Fallback web Transaction response missing payment URL:",
          webTransaction
        );
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
    console.log(
      "Received Tranzak webhook payload:",
      JSON.stringify(req.body, null, 2)
    );

    // Using 'resource' instead of 'data'
    const { resource } = req.body;
    if (!resource || !resource.requestId) {
      console.error("Invalid webhook payload:", req.body);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const incomingRequestId = resource.requestId;

    // Find the Payment record matching either the initial or redirect transaction id.
    let paymentRecord = await Payment.findOne({
      $or: [
        { transactionId: incomingRequestId },
        { redirectTransactionId: incomingRequestId },
      ],
    });

    if (!paymentRecord) {
      console.error(
        `No Payment record found for transaction ${incomingRequestId}`
      );
      return res.sendStatus(404);
    }

    // Use the original transactionId as the key for webhook count
    const paymentKey = paymentRecord.transactionId;
    if (!webhookCount[paymentKey]) {
      webhookCount[paymentKey] = 1;
    } else {
      webhookCount[paymentKey]++;
    }

    console.log(
      `Webhook count for payment ${paymentKey}: ${webhookCount[paymentKey]}`
    );

    // When the second webhook arrives and status is COMPLETED or SUCCESSFUL,
    // update the Payment record and the corresponding User's "paid" status.
    if (
      webhookCount[paymentKey] >= 2 &&
      (resource.status === "COMPLETED" || resource.status === "SUCCESSFUL")
    ) {
      console.log("Payment confirmed for transaction:", paymentKey);

      // Update Payment record status
      paymentRecord = await Payment.findOneAndUpdate(
        { _id: paymentRecord._id },
        { status: "completed" },
        { new: true }
      );

      if (paymentRecord) {
        // Update User's paid status using the email stored in the Payment record
        const userUpdate = await User.findOneAndUpdate(
          { email: paymentRecord.email },
          { paid: true },
          { new: true }
        );
        if (userUpdate) {
          console.log(`User ${paymentRecord.email} marked as paid.`);
        } else {
          console.error(`User with email ${paymentRecord.email} not found.`);
        }
      } else {
        console.error(
          `Failed to update Payment record for transaction ${paymentKey}`
        );
      }

      console.log("Hello Big World");
    }

    // Log additional status info
    switch (resource.status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        console.log(
          "Transaction completed successfully. Transaction ID:",
          incomingRequestId
        );
        break;
      case "PAYMENT_IN_PROGRESS":
        console.log(
          "Payment is still in progress for transaction:",
          incomingRequestId
        );
        break;
      default:
        console.log(
          "Received unsupported transaction status:",
          resource.status
        );
        break;
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.sendStatus(500);
  }
};

exports.getPayment = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const payments = await Payment.find({ email });

    if (payments.length === 0) {
      return res.status(404).json({ message: "No payments found for this email." });
    }

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
