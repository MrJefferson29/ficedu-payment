import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

const API_URL = 'https://your-backend.com/pay'; // Replace with your backend URL

const Payment = () => {
  const [amount, setAmount] = useState('');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);

  // This function submits the payment details to your backend.
  const handlePaymentInitiation = async () => {
    if (!amount || !mobileWalletNumber || !description || !email) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, mobileWalletNumber, description, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Payment initiation failed.');
        setLoading(false);
        return;
      }

      // On success, get the redirectUrl from the response and load it in the WebView.
      setRedirectUrl(data.redirectUrl);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing your payment.');
      console.error('Payment initiation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // If redirectUrl exists, render the WebView for payment processing.
  if (redirectUrl) {
    return (
      <WebView
        source={{ uri: redirectUrl }}
        onNavigationStateChange={(navState) => {
          // You can check the URL for the returnUrl endpoint to know when the payment is complete.
          if (navState.url.includes('payment-success')) {
            Alert.alert('Success', 'Your payment has been completed!');
            // Optionally, clear the WebView by resetting redirectUrl.
            setRedirectUrl(null);
          }
        }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator style={styles.loading} size="large" />}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Make a Payment</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Mobile Wallet Number"
        value={mobileWalletNumber}
        onChangeText={setMobileWalletNumber}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <Button title="Pay Now" onPress={handlePaymentInitiation} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default Payment;
