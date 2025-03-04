import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Soon() {
    const router = useRouter()
    return (
        <View style={styles.container}>
            <Text style={styles.soon}>This feature is coming soon </Text>
            <Text style={styles.home} onPress={() => router.push('/')}>Go Home</Text>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    soon: {
        fontSize: 18,
    },
    home: {
        fontSize: 17,
        fontWeight: '400',
        textDecorationLine: 'underline'
    }
})