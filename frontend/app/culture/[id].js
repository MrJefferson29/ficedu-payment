import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const DetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        console.log('Fetching details for id:', id); // Check the ID

        const response = await axios.get(`https://ficedu.onrender.com/features/${id}`);
        
        console.log('API Response:', response); // Log the API response to verify its structure

        if (response && response.data) {
          setItem(response.data); // Set the item state with the correct data
          console.log('Item Set:', response.data); // Log the item data after setting it
        } else {
          setError('Invalid data structure');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to fetch item details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetail();
    } else {
      setError('Invalid ID');
      setLoading(false);
    }
  }, [id]);

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pauseAsync(); // Pause the video
    } else {
      videoRef.current.playAsync(); // Start the video
    }
    setIsPlaying(!isPlaying); // Toggle the play/pause state
  };

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

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text>No item found</Text>
      </View>
    );
  }

  console.log('Item:', item); // Log the item state during render

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.content}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: `${item.files[0]}` }} // Assuming video is a URL
            style={styles.video}
            resizeMode="contain"
            shouldPlay={isPlaying} // Control play state with this
            useNativeControls={isPlaying} // Show controls only when video is playing
          />
        </View>
        {!isPlaying && (
          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <Ionicons name='play' size={30} color={'aliceblue'} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailContainer}>
        <View style={styles.textTopic}>
          <View style={styles.iconContainer}>
            <Ionicons name='school' size={25} color={'#D8C9AE'} />
          </View>
          <Text style={styles.topic}>{item.title}</Text>
        </View>

        <View style={styles.line}></View>

        <Text style={styles.textContent}>{item.notes}</Text>
      </View>
    </View>
  );
};

export default DetailScreen;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: 250,
    borderRadius: 10,
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
