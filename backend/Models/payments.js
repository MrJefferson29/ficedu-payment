const Tranzak = require('tranzak-node'); // Import the class
const shortUUID = require('short-uuid');
require('dotenv').config();

const client = new Tranzak({  // <--- The 'new' keyword is essential
    appId: process.env.TRANZAK_APP_ID || 'aprb1ozfx10r31',
    appKey: process.env.TRANZAK_APP_KEY || '939AC5BF3348EA37FC24C34209AF71DC',
    mode: process.env.TRANZAK_MODE || 'sandbox', // 'sandbox' or 'live'
});
const processPayment = async (req, res) => {
  try {
    const { amount, mobileWalletNumber, description } = req.body;

    const transaction = await client.payment.collection.simple.chargeMobileMoney({
      amount,
      currencyCode: 'XAF',
      description,
      payerNote: description,
      mchTransactionRef: shortUUID.generate(),
      mobileWalletNumber,
    });

    await transaction.refresh();

    if (transaction.data.status === 'SUCCESSFUL') {
      console.log(`Transaction successful! Processing funds transfer...`);

      const collectionAccount = (await client.account.list()).find(
        (acc) => acc.data.accountId === transaction.data.merchant.accountId
      );

      await client.payment.transfer.simple.toPayoutAccount({
        amount: amount * 0.93, // Example: Deduct 7% for fees
        currencyCode: 'XAF',
        customTransactionRef: collectionAccount.data.accountId,
        description: 'For payouts',
        payeeNote: 'For payouts.',
        fundingAccountId: collectionAccount.data.accountId,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        transaction: transaction.data,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Payment failed',
      transaction: transaction.data,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

module.exports = { processPayment };
