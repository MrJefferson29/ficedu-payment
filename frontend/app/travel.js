import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Video } from 'expo-av';

const Travel = () => {
    const { id, heading } = useLocalSearchParams(); // Get course ID
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [durations, setDurations] = useState({}); // Store video durations
    const router = useRouter();

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await axios.get(`http://192.168.143.1:5000/courses/67a5fd5cf376cb2608d8fa35`);
                setVideos(response.data.data);
            } catch (err) {
                setError('Failed to load videos');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    // Toggle the dropdown visibility
    const toggleDropdown = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Format duration to mm:ss
    const formatDuration = (milliseconds) => {
        if (!milliseconds) return "00:00";
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>LEARN SELF DISCOVERY</Text>
            <FlatList
                data={videos}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <Pressable onPress={() => toggleDropdown(index)} style={styles.card}>
                        <View>
                            <Text style={styles.chapter}>{item.chapter}</Text>
                            <Text style={styles.content}>{item.content}</Text>
                            {expandedIndex === index && (
                                <View style={styles.dropdownContent}>
                                    {item.videos.map((video, idx) => (
                                        <Pressable
                                            key={idx}
                                            onPress={() =>
                                                router.push({
                                                    pathname: `/video/${video.title}`,
                                                    params: { title: video.title, file: video.file, heading },
                                                })
                                            }
                                            style={styles.videoDetails}
                                        >
                                            <View style={styles.wrapper}>
                                                <Video
                                                    source={{ uri: `${video.file}` }}
                                                    style={styles.videoContainer}
                                                    useNativeControls
                                                    resizeMode="contain"
                                                    onLoad={(data) =>
                                                        setDurations((prev) => ({
                                                            ...prev,
                                                            [video.file]: formatDuration(data.durationMillis),
                                                        }))
                                                    }
                                                />
                                                <View style={styles.textContainer}>
                                                    <Text style={styles.title}>{video.title}</Text>
                                                    <Text style={styles.file}>
                                                        {durations[video.file] || "Loading..."}
                                                    </Text>
                                                </View>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8f9fa',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: 'red',
        fontSize: 16,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    wrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    videoContainer: {
        width: 120,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#000',
    },
    textContainer: {
        width: '65%',
        marginLeft: 5,
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 10,
    },
    chapter: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        fontSize: 16,
        color: '#333',
        marginTop: 5,
    },
    dropdownContent: {
        marginTop: 10,
        paddingLeft: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    videoDetails: {
        marginBottom: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    file: {
        fontSize: 15,
        color: '#333',
        position: 'absolute',
        bottom: 0,
        right: 0,
        marginRight: 15,
    },
});

export default Travel;
