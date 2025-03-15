import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  ActivityIndicator, 
  Alert, 
  StyleSheet 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from './Contexts/AuthContext';

const Payment = () => {
  const { userToken } = useContext(AuthContext); // Using userToken from AuthContext for authorization
  const [loading, setLoading] = useState(false);
  const [profileEmail, setProfileEmail] = useState(''); // New state to store fetched email
  const [amount, setAmount] = useState('');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('');
  const [description, setDescription] = useState('Relevant Skills'); // Default selection

  // Fetch user profile to get the email
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) {
        return;
      }
      try {
        const response = await fetch('https://ficedu.onrender.com/user/profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        // Update the email from the fetched profile data
        setProfileEmail(data.data.email);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    };

    fetchProfile();
  }, [userToken]);

  const initiatePayment = async () => {
    // Basic form validation
    if (!amount || !mobileWalletNumber || !description) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://ficedu-payment.onrender.com/process/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount), // Ensure the amount is a number
          mobileWalletNumber,
          description,
          email: profileEmail || 'default@example.com', // Use fetched email
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        if (data.paymentUrl) {
          await WebBrowser.openBrowserAsync(data.paymentUrl);
        } else {
          Alert.alert('Error', 'Payment URL was not provided by the server.');
        }
      } else {
        Alert.alert('Error', data.error || 'Payment processing failed.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Make a Payment</Text>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Wallet Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile wallet number"
            keyboardType="phone-pad"
            value={mobileWalletNumber}
            onChangeText={setMobileWalletNumber}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={description}
              onValueChange={(itemValue) => setDescription(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Relevant Skills" value="Relevant Skills" />
              <Picker.Item label="Travel Abroad Course" value="Travel Abroad Course" />
              <Picker.Item label="Self Discovery" value="Self Discovery" />
            </Picker>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.emailDisplay}>
            {profileEmail || 'Loading email...'}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <Button title="Pay Now" onPress={initiatePayment} color="#ffffff" />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
  },
  emailDisplay: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  buttonContainer: {
    backgroundColor: '#4a90e2',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 10,
  },
});

export default Payment;
