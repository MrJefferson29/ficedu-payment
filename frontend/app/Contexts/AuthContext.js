import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const getUserData = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    };

    const saveUserData = async (token, email) => {
        try {
            const userData = { token, email };
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUserToken(token);
            setUserEmail(email);
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    };

    const removeUserData = async () => {
        try {
            await AsyncStorage.removeItem('userData');
            setUserToken(null);
            setUserEmail(null);
        } catch (error) {
            console.error('Error removing user data:', error);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const userData = await getUserData();
            if (userData) {
                setUserToken(userData.token);
                setUserEmail(userData.email);
            }
            setIsLoading(false);
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            // Defer navigation until after the initial render
            setTimeout(() => {
                if (userToken) {
                    router.push('/');
                } else {
                    router.push('/login');
                }
            }, 0);
        }
    }, [userToken, isLoading]);

    return (
        <AuthContext.Provider value={{ userToken, userEmail, saveUserData, removeUserData, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
