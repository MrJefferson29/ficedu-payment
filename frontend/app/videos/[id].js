import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const VideoList = () => {
    const { id, heading } = useLocalSearchParams();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [durations, setDurations] = useState({});
    const [watchedVideos, setWatchedVideos] = useState([]);
    const [chapter, setChapter] = useState('');
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [showAddCourse, setShowAddCourse] = useState(false); // State to control visibility
    const router = useRouter();

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await axios.get(`https://ficedu.onrender.com/courses/get-all/${id}`);
                setVideos(response.data.data);

                // Load watched videos from AsyncStorage
                const storedWatchedVideos = await AsyncStorage.getItem(`watchedVideos_${id}`);
                if (storedWatchedVideos) {
                    setWatchedVideos(JSON.parse(storedWatchedVideos));
                }
            } catch (err) {
                setError('No videos found yet');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [id]);

    const handleSubmit = async () => {
        if (selectedVideos.length === 0) {
            Alert.alert('Error', 'No videos selected');
            return;
        }
    
        const allowedFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv']; // MP4, MOV, AVI, WMV
        const formData = new FormData();
    
        for (let video of selectedVideos) {
            if (!allowedFormats.includes(video.mimeType)) {
                Alert.alert('Error', `Invalid format: ${video.mimeType}. Please upload an MP4, MOV, AVI, or WMV video.`);
                return;
            }
    
            formData.append('file', {
                uri: video.uri,
                name: video.uri.split('/').pop(),
                type: video.mimeType,
            });
        }
    
        formData.append('chapter', chapter);
        formData.append('content', content);
        formData.append('title', title);
    
        try {
            const response = await fetch(`https://ficedu.onrender.com/courses/${id}/video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });
    
            const data = await response.json();
    
            if (response.ok) {
                Alert.alert('Success', 'Video added successfully');
                router.push('/');
                setChapter('');
                setContent('');
                setTitle('');
                setSelectedVideos([]);
            } else {
                Alert.alert('Error', data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to add video. Please try again later.');
        }
    };
    

    const pickVideos = async () => {
        try {
            // Request permission to access media
            const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (mediaPermission.granted) {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,  // Allow only videos
                    allowsMultipleSelection: true,  // Allow multiple selection
                    quality: 1,  // High quality videos
                });
                if (!result.canceled) {
                    setSelectedVideos(result.assets);  // Store selected assets (videos)
                }
            } else {
                Alert.alert('Permission Denied', 'You need to grant media access to pick videos.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to pick videos');
        }
    };
    const formatDuration = (milliseconds) => {
        if (!milliseconds) return '00:00';
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleVideoPress = async (video, index) => {
        if (index > 0 && !watchedVideos.includes(videos[0].videos[0].file)) {
            alert('You must watch the first video before accessing this one.');
            return;
        }

        // Mark video as watched when user navigates
        if (!watchedVideos.includes(video.file)) {
            const updatedWatchedVideos = [...watchedVideos, video.file];
            setWatchedVideos(updatedWatchedVideos);
            await AsyncStorage.setItem(`watchedVideos_${id}`, JSON.stringify(updatedWatchedVideos));
        }

        router.push({
            pathname: `/video/${video.title}`,
            params: { title: video.title, file: video.file, heading },
        });
    };
    const renderVideoList = () => {
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

        return (
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
                                    {item.videos.map((video, idx) => {
                                        const isLocked = idx > 0 && !watchedVideos.includes(item.videos[idx - 1].file);
                                        return (
                                            <Pressable
                                                key={idx}
                                                onPress={() => handleVideoPress(video, idx)}
                                                disabled={isLocked}
                                                style={[styles.videoDetails, isLocked && styles.lockedVideo]}
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
                                                            {durations[video.file] || 'Loading...'}
                                                        </Text>
                                                        {isLocked && <Text style={styles.lockedText}>Locked</Text>}
                                                    </View>
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </Pressable>
                )}
            />
        );
    };

    // Function to toggle the dropdown of a specific card
    const toggleDropdown = (index) => {
        // If the card is already expanded, collapse it; otherwise, expand it.
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>LEARN {heading}</Text>
            {renderVideoList()}
            {/* <Pressable onPress={() => setShowAddCourse(!showAddCourse)} style={styles.addCourseButton}>
                <Text style={styles.footer}>Add Video</Text>
            </Pressable> */}
            {showAddCourse && (
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Course Chapter"
                        value={chapter}
                        onChangeText={setChapter}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Course Content"
                        value={content}
                        onChangeText={setContent}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Video Title"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <Button title="Pick Videos" onPress={pickVideos} />
                    <Button title="Add Item" onPress={handleSubmit} />
                </View>
            )}
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
    footer: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        backgroundColor: '#D8C9AE',
        padding: 15,
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
        justifyContent: 'center',
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
    lockedVideo: {
        opacity: 0.5,
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
        marginRight: 20,
    },
    lockedText: {
        fontSize: 14,
        color: 'red',
        fontWeight: 'bold',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 8,
    },
});

export default VideoList;
