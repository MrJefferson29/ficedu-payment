import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";

const Payment = () => {
  const [amount, setAmount] = useState("");
  const [mobileWalletNumber, setMobileWalletNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);

  const handlePayment = async () => {
    if (!amount || !mobileWalletNumber || !email) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("https://your-backend-url.com/api/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, mobileWalletNumber, description: "Payment", email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.redirectUrl) {
        setRedirectUrl(data.redirectUrl);
      } else {
        Alert.alert("Error", data.error || "Payment initiation failed.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to process payment.");
    }
  };

  if (redirectUrl) {
    return <WebView source={{ uri: redirectUrl }} />;
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Make a Payment</Text>
      <TextInput
        placeholder="Enter Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={{ borderBottomWidth: 1, marginBottom: 20, padding: 10 }}
      />
      <TextInput
        placeholder="Mobile Wallet Number"
        keyboardType="numeric"
        value={mobileWalletNumber}
        onChangeText={setMobileWalletNumber}
        style={{ borderBottomWidth: 1, marginBottom: 20, padding: 10 }}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderBottomWidth: 1, marginBottom: 20, padding: 10 }}
      />
      <TouchableOpacity onPress={handlePayment} style={{ backgroundColor: "#4CAF50", padding: 15, borderRadius: 5 }}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", textAlign: "center" }}>Pay Now</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default Payment;
