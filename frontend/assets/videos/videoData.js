import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function Dashboard() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get('http://192.168.33.100:5000/profile', {
                headers: {
                    'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`  // You can replace with the actual token
                }
            });

            // Assuming 'referrals' is part of the user data returned
            const userData = response.data.data;
            setReferrals(userData.referrals || []);  // Assuming your profile includes 'referrals'

        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to fetch profile data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Referrals</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#575757" />
            ) : referrals.length === 0 ? (
                <Text style={styles.noData}>No referrals found.</Text>
            ) : (
                <FlatList
                    data={referrals}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.referralCard}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.email}>{item.email}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#575757',
    },
    noData: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
        marginTop: 20,
    },
    referralCard: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 14,
        color: '#666',
    },
});
