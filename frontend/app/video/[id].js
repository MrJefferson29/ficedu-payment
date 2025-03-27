import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://192.168.121.1:5000';
const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.5625; // 16:9 ratio

const VideoDetails = () => {
  const { id } = useLocalSearchParams();
  const [videoDetails, setVideoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/courses/video/${id}`);
        setVideoDetails(response.data.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load video details.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideoDetails();
  }, [id]);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aced" />
      </View>
    );
  }

  if (!videoDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Video details not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <TouchableOpacity
          style={styles.videoTouchable}
          onPress={() => setControlsVisible(!controlsVisible)}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoDetails.videoUrl || videoDetails.file }}
            style={styles.video}
            resizeMode="contain"
            shouldPlay={isPlaying}
            useNativeControls={false}
          />
          {controlsVisible && (
            <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={50} color="#FFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{videoDetails.title}</Text>
        <Text style={styles.description}>{videoDetails.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: '#000',
    height: VIDEO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
  },
  controlButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 50,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 18,
    color: '#666',
    lineHeight: 26,
  },
  errorText: {
    fontSize: 20,
    color: '#d9534f',
  },
});

export default VideoDetails;
