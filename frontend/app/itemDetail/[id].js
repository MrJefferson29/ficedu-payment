// pages/itemdetail/[id].js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetail() {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { id } = useLocalSearchParams();

    if (!id) {
        return <Text>Invalid ID or no ID provided</Text>;
    }

    useEffect(() => {
        const fetchItemDetail = async () => {
            try {
                const response = await axios.get(`https://ficedu.onrender.com/shop/${id}`);
                setItem(response.data.data);
            } catch (err) {
                setError('Failed to fetch item details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchItemDetail();
        }
    }, [id]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {item && (
                <>
                    <Image
                        source={{ uri: `${item.images[0]}` }}
                        style={styles.image}
                    />
                    <View style={styles.content}>
                        <View style={styles.buttons}>
                            <TouchableOpacity style={styles.button}>
                                <Ionicons name='call-outline' size={25} color={'white'} />
                                <Text style={styles.buttonText}>Telephone </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button}>
                                <Ionicons name='logo-whatsapp' size={25} color={'white'} />
                                <Text style={styles.buttonText}>Whatsapp </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.price}>XAF {item.price}</Text>
                        </View>
                        <Text style={styles.description}>{item.description} </Text>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    image: {
        width: '100%',
        height: 320,
        resizeMode: 'cover',
    },
    content: {
        padding: 10,
    },
    buttons: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    button: {
        backgroundColor: '#575757',
        paddingHorizontal: 20,
        paddingVertical: 15,
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 7,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 15,
        color: '#D8C9AE'
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 10,
        color: '#575757',
    },
    price: {
        fontSize: 20,
        color: '#575757',
        marginTop: 10,
        width: 105,
        fontWeight: '400'
    },
    description: {
        fontSize: 16,
        color: '#4A4A4A',
        marginTop: 15,
        lineHeight: 24,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
