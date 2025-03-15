import React, { useContext, useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './Contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function Login() {
    const { saveUserData } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            console.log('Attempting login with:', email, password);
            const response = await axios.post('http://192.168.196.1:5000/auth/login', {
                email,
                password,
            });

            console.log('Login response:', response);

            // Save token, user data, and email to AsyncStorage using the correct property names.
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
            await AsyncStorage.setItem('userEmail', response.data.data.email);
            console.log('Token, user data, and email saved to AsyncStorage');

            // Update AuthContext with the user data
            saveUserData(response.data.token, response.data.data.email);
        } catch (error) {
            console.log('Login error:', error.response?.data || error.message || 'Unknown error');
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
        }
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.title}>FiCEdu</Text>
            <Text style={styles.subtitle}>Login to your Account!</Text>
            <View>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign in</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>- Or sign up with -</Text>
            <View style={styles.iconContainer}>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image
                        source={require('../assets/images/google.png')}
                        style={styles.image}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image
                        source={require('../assets/images/facebook.png')}
                        style={styles.image}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image
                        source={require('../assets/images/twitter.png')}
                        style={styles.image}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Don't have an account?{' '}
                    <Text style={styles.signUp} onPress={() => router.push('/register')}>
                        Sign up!
                    </Text>
                </Text>
            </View>
        </View>
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
        padding: 50,
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
        elevation: 5,
    },
    image: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        marginTop: 30,
    },
    signUp: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: 'bold',
    },
});
