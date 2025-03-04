// PaymentScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const Payment = () => {
  const [amount, setAmount] = useState('');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handlePayment = async () => {
    if (!amount || !mobileWalletNumber || !description || !email) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    
    // Log current transactionId for debugging
    console.log('Current Transaction ID:', transactionId);
    
    setLoading(true);

    try {
      // Replace with your actual backend endpoint
      const response = await fetch('http://192.168.245.1:5000/process/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          mobileWalletNumber,
          description,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Payment failed');
      } else if (response.status === 200) {
        setTransactionId(data.transactionId);
        Alert.alert('Success', `Payment processed. Transaction ID: ${data.transactionId}`);
      } else if (response.status === 202 && data.paymentUrl) {
        await WebBrowser.openBrowserAsync(data.paymentUrl);
      } else {
        Alert.alert('Error', 'Unexpected response from payment processing.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred while processing payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Make a Payment</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile Wallet Number"
        value={mobileWalletNumber}
        onChangeText={setMobileWalletNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Pay Now" onPress={handlePayment} />
      )}
      {transactionId ? (
        <Text style={styles.success}>Transaction ID: {transactionId}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  success: {
    marginTop: 16,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
});

export default Payment;
