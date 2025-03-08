// PaymentScreen.js
import React, { useState } from 'react';
import { View, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const Payment = () => {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    setLoading(true);
    try {
      // Replace with your actual backend endpoint URL
      const response = await fetch('https://ficedu-payment.onrender.com/process/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 2500,
          mobileWalletNumber: '237679691817',
          description: 'Test Payment',
          email: "lana@gmail.com"
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        if (data.paymentUrl) {
          // Open the payment URL in the browser
          await WebBrowser.openBrowserAsync(data.paymentUrl);
        } else {
          Alert.alert("Error", "Payment URL was not provided by the server.");
        }
      } else {
        Alert.alert("Error", data.error || "Payment processing failed.");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Pay Now" onPress={initiatePayment} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default Payment;
