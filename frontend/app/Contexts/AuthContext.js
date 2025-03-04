import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // Use the useRouter hook from expo-router

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter(); // Get the router object

    // Helper functions for token management
    const getToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            return token;
        } catch (error) {
            console.error('Error fetching token:', error);
            return null;
        }
    };

    const saveToken = async (token) => {
        try {
            await AsyncStorage.setItem('userToken', token);
            setUserToken(token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    };

    const removeToken = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    };

    useEffect(() => {
        const fetchToken = async () => {
            const token = await getToken();
            setUserToken(token);
            setIsLoading(false);
        };
        fetchToken();
    }, []);

    useEffect(() => {
        if (userToken) {
            // Redirect to the desired page once the token is set
            router.push('/'); // Use router.push from expo-router
        }
    }, [userToken]); // Runs when userToken changes

    return (
        <AuthContext.Provider value={{ userToken, setUserToken: saveToken, removeToken, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
