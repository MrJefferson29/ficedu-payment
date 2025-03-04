import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Video } from 'expo-av';

const { height, width } = Dimensions.get('window'); // To get the screen dimensions

const lectures = [
    { id: 1, title: 'Chapter 01', topic: 'Learning the alphabet in the Bamesing dialect', video: require('../../assets/videos/vid1.mp4') },
    { id: 2, title: 'Chapter 02', topic: 'Counting from 1 to 50 in Bamesing', video: require('../../assets/videos/bad.mp4') },
    { id: 3, title: 'Chapter 03', topic: 'Basic nouns in the dialect, and pronunciation', video: require('../../assets/videos/vid1.mp4') },
    { id: 4, title: 'Chapter 04', topic: 'Singing common songs in the dialect', video: require('../../assets/videos/vid1.mp4') },
];

const LectureDetails = () => {
    const { id } = useLocalSearchParams();
    const lecture = lectures.find((item) => item.id === parseInt(id));

    if (!lecture) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Lecture not found</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Video
                source={lecture.video}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
            />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{lecture.title}</Text>
                    <Text style={styles.topic}>{lecture.topic}</Text>
                </View>
                <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>
                        Learn the fundamentals of the Bamesing dialect through these engaging lessons.
                        Watch the video to dive deeper into the subject.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

export default LectureDetails;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9f9f9',
        paddingTop: 320, // Adjust to make space for the fixed video
    },
    content: {
        flex: 1,
    },
    header: {
        marginBottom: 16,
        paddingHorizontal: 16,

    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    topic: {
        fontSize: 16,
        color: '#555',
        marginBottom: 16,
    },
    video: {
        position: 'absolute', // Fixed position at the top
        top: 0,
        left: 0,
        width: '100%',
        height: 300,
        backgroundColor: '#000',
    },
    descriptionContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        height: 400
    },
    description: {
        fontSize: 17,
        color: '#575757',
        lineHeight: 22,
        textAlign: 'justify',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    errorText: {
        fontSize: 18,
        color: '#d9534f',
        fontWeight: 'bold',
    },
});
