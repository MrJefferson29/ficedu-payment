import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from './Contexts/AuthContext';
import Loading from './loading';

const Payment = () => {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [description, setDescription] = useState('RELEVANT SKILL'); // Default selection

  // Fetch user profile to get the email
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) return;
      try {
        const response = await fetch('https://ficedu-payment.onrender.com/user/profile', {
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
        setProfileEmail(data.data.email);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    };

    fetchProfile();
  }, [userToken]);

  // Calculate amount based on description
  const getAmountByDescription = (desc) => {
    switch (desc) {
      case 'RELEVANT SKILL':
        return 60000;
      case 'TRAVEL ABROAD':
        return 30000;
      case 'SELF DISCOVERY':
        return 30000;
      default:
        return 0;
    }
  };

  const amount = getAmountByDescription(description);
  const mobileWalletNumber = 237654711169; // Hardcoded

  const initiatePayment = async () => {
    if (!description || !profileEmail) {
      Alert.alert('Error', 'Please ensure all fields are filled.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://ficedu-payment.onrender.com/process/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          mobileWalletNumber,
          description,
          email: profileEmail || 'default@example.com',
        }),
      });
      
      const data = await response.json();

      if (response.ok && data.paymentUrl) {
        await WebBrowser.openBrowserAsync(data.paymentUrl);
      } else {
        Alert.alert('Error', data.error || 'Payment processing failed.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Make a Payment of {amount.toLocaleString()} XAF
      </Text>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>SELECT THE COURSE</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={description}
              onValueChange={(itemValue) => setDescription(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="RELEVANT SKILL" value="RELEVANT SKILL" />
              <Picker.Item label="TRAVEL ABROAD" value="TRAVEL ABROAD" />
              <Picker.Item label="SELF DISCOVERY" value="SELF DISCOVERY" />
            </Picker>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.buttonContainer} 
          onPress={initiatePayment}
          activeOpacity={0.8}
        >
          {loading ? (
            <Loading />
          ) : (
            <Text style={styles.buttonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f3', // A soft background color for a clean look
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    color: '#555',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
  },
  buttonContainer: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Payment;