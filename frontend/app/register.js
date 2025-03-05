import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image, ScrollView } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function Register({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const router = useRouter()

    const handleRegister = async () => {
        try {
            const response = await axios.post('http://192.168.245.1:5000/auth/register', {
                username,
                email,
                password,
                name,
                phone,
                referralCode,
            });
            Alert.alert('Success', 'Registration successful! You can now log in.');
            router.push('/login'); // Navigate to Login screen
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
        }
    };

    return (
        <ScrollView>
            <View style={styles.wrapper}>
                <Text style={styles.title}>PAC APP</Text>
                <Text style={styles.subtitle}>Login to your Account!</Text>
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Mobile Number"
                        keyboardType="email-address"
                        value={phone}
                        onChangeText={setPhone}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Referral Code (optional)"
                        value={referralCode}
                        onChangeText={setReferralCode}
                    />
                </View>
                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Sign up</Text>
                </TouchableOpacity>
                <Text style={styles.orText}>- Or sign up with -</Text>
                <View style={styles.iconContainer}>
                    <TouchableOpacity style={styles.iconWrapper}>
                        <Image
                            source={require('../assets/images/google.png')} // Replace with your image path
                            style={styles.image}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconWrapper}>
                        <Image
                            source={require('../assets/images/facebook.png')} // Replace with your image path
                            style={styles.image}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconWrapper}>
                        <Image
                            source={require('../assets/images/twitter.png')} // Replace with your image path
                            style={styles.image}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Have an account?{' '}
                        <Text style={styles.signUp} onPress={() => router.push('/login')}>
                            Sign in!
                        </Text>
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        padding: 20,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 20,
        color: '#D8C9AE',
        padding: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#f0f0f0',
        marginBottom: 20,
        padding: 10,
        borderRadius: 4,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    button: {
        backgroundColor: '#575757',
        paddingVertical: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    orText: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#575757',
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    iconWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5, // For Android shadow
    },
    image: {
        width: 30,
        height: 30, // Adjusted size
        resizeMode: 'contain',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        marginTop: 20,
    },
    signUp: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: 'bold',
    },
});
