import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from "react-native";

export default function Support() {
    const handleDial = () => {
        const phoneNumber = "*126*1*1*654711169#";
        Linking.openURL(`tel:${phoneNumber}`);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Support This Initiative</Text>
            <Text style={styles.description}>Scan the QR code below, or tap on it to be redirected. For now, we only support MTN payments</Text>
            <TouchableOpacity onPress={handleDial}>
                <Image style={styles.image} source={require('../assets/images/scan.jpg')} />
            </TouchableOpacity>
            <Text style={styles.sponsor}>Sponsored by Techwi Pay</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    image: {
        width: 300,
        height: 300,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D8D8D8',
        marginBottom: 20,
    },
    sponsor: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
    },
});
