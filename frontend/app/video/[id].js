import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';

const VideoDetails = () => {
    const router = useRouter();
    const { title, file, heading } = useLocalSearchParams();
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);

    const handlePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setLoading(false);
        alert('Error loading video.');
    };

    const handlePlaybackStatusUpdate = (status) => {
        if (status.isPlaying !== undefined) {
            setIsPlaying(status.isPlaying);
        }
    };

    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.pauseAsync();
            }
        };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={styles.content}>
                <View style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: `${file}` }} 
                        style={styles.video}
                        resizeMode="contain"
                        shouldPlay={isPlaying}
                        useNativeControls={false}
                        onLoad={handleLoad}
                        onError={handleError}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    />
                    {loading && (
                        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
                    )}
                    {!loading && !isPlaying && (
                        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                            <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={40}
                                color={'aliceblue'}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.detailContainer}>
                <View style={styles.textTopic}>
                    <View style={styles.iconContainer}>
                        <Ionicons name='school' size={25} color={'#D8C9AE'} />
                    </View>
                    <Text style={styles.topic}>{heading}</Text>
                </View>

                <View style={styles.line}></View>

                <Text style={styles.textContent}>{title}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
    },
    videoContainer: {
        width: '100%',
        backgroundColor: 'black',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: 250,
        borderRadius: 10,
    },
    loader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
        zIndex: 2,
    },
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -30 }, { translateY: -30 }],
        backgroundColor: '#D8C9AE',
        padding: 10,
        borderRadius: 55,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
    },
    detailContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        flex: 1,
    },
    textTopic: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    iconContainer: {
        padding: 5,
        backgroundColor: '#575757',
        borderRadius: 20,
        marginRight: 10,
    },
    topic: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    line: {
        borderWidth: 0.2,
        borderColor: 'black',
        marginVertical: 15,
    },
    textContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: 0.3,
        color: '#575757',
    },
});

export default VideoDetails;
