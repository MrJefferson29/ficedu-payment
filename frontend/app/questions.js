import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';

const QuestionsList = () => {
    const { subject } = useLocalSearchParams();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!subject) return;

        const fetchQuestions = async () => {
            try {
                const response = await axios.post('https://ficedu.onrender.com/question/get-all', { subject });
                setQuestions(response.data.data || []);
            } catch (error) {
                setError('Failed to load questions. Please try again.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [subject]);

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Loading questions...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {questions.length === 0 ? (
                <Text style={styles.emptyText}>No questions available.</Text>
            ) : (
                <FlatList
                    data={questions}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.questionCard}>
                            <Text style={styles.questionText}>{item.subject} - {item.year}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const AnswersList = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.placeholderText}>Answers will be displayed here.</Text>
        </View>
    );
};

const QuestionsScreen = () => {
    const [activeTab, setActiveTab] = useState('questions');

    return (
        <View style={styles.screenContainer}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'questions' && styles.activeTab]}
                    onPress={() => setActiveTab('questions')}
                >
                    <Text style={[styles.tabText, activeTab === 'questions' && styles.activeTabText]}>
                        Questions
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'answers' && styles.activeTab]}
                    onPress={() => setActiveTab('answers')}
                >
                    <Text style={[styles.tabText, activeTab === 'answers' && styles.activeTabText]}>
                        Answers
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'questions' ? <QuestionsList /> : <QuestionsList />}
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#575757',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: 'white',
    },
    tabText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    activeTabText: {
        color: '#D8C9AE', // Gold color to highlight the active tab
    },
    container: {
        flex: 1,
        padding: 20,
    },
    questionCard: {
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#575757',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
    },
    placeholderText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginTop: 50,
    },
});

export default QuestionsScreen;
