import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';

const SocialFeed = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [manualPaused, setManualPaused] = useState(false); // tracks if user manually paused
  const videoRefs = useRef({}); // store refs for each video

  const router = useRouter();

  // Helper to format date
  const editDate = (createdAt) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const d = new Date(createdAt);
    return `${d.getDate()} ${monthNames[d.getMonth()]} ,${d.getFullYear()}`;
  };

  // Fetch the complete list of items
  const fetchFeatures = async () => {
    try {
      const response = await axios.get('https://ficedu.onrender.com/features/get-all');
      setFeatures(response.data);
    } catch (error) {
      setError('Error fetching features');
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  // When the screen loses focus, stop any playing video.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setPlayingVideoId(null);
        setManualPaused(false);
      };
    }, [])
  );

  // Viewability configuration: ensure that an item is at least 80% visible.
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  // Callback fired when the viewable items change.
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!manualPaused && viewableItems && viewableItems.length > 0) {
      // Select the first item that is at least 80% visible.
      const visibleItem = viewableItems[0].item;
      if (visibleItem._id !== playingVideoId) {
        setPlayingVideoId(visibleItem._id);
      }
    }
  }).current;

  // Toggle play/pause when user taps on the video.
  const handleVideoTap = (id) => {
    if (id === playingVideoId) {
      // Pause video via its ref.
      if (videoRefs.current[id]) {
        videoRefs.current[id].pauseAsync();
      }
      setPlayingVideoId(null);
      setManualPaused(true);
    } else {
      setPlayingVideoId(id);
      setManualPaused(false);
      if (videoRefs.current[id]) {
        videoRefs.current[id].playAsync();
      }
    }
  };

  // Dummy handlers for comment and share actions.
  const handleComment = (id) => {
    Alert.alert("Comment", "This would open the comments section for the post.");
  };

  const handleShare = (id) => {
    Alert.alert("Share", "This would trigger the share functionality.");
  };

  const renderItem = ({ item }) => {
    const isPlaying = playingVideoId === item._id;
    return (
      <View style={styles.card}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => handleVideoTap(item._id)}
          style={styles.videoContainer}
        >
          <Video
            ref={(ref) => (videoRefs.current[item._id] = ref)}
            source={{ uri: item.files[0] }}
            style={styles.video}
            resizeMode="contain"
            isLooping
            shouldPlay={isPlaying}
            isMuted={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                setPlayingVideoId(null);
                setManualPaused(false);
              }
            }}
          />
          {!isPlaying && (
            <Ionicons
              name="play"
              size={40}
              style={styles.playIcon}
              accessibilityLabel="Play Video"
            />
          )}
        </TouchableOpacity>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Ionicons name="compass" size={30} color={'#D8C9AE'} />
            <Text style={styles.categoryText}> {item.category} </Text>
          </View>
          <Text style={styles.topic}>{item.notes}</Text>
          <Text style={styles.dateText}>{editDate(item.createdAt)}</Text>
          <View style={styles.socialBar}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="heart-outline" size={24} color="#555" />
              <Text style={styles.socialText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleComment(item._id)} style={styles.socialButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#555" />
              <Text style={styles.socialText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(item._id)} style={styles.socialButton}>
              <Ionicons name="share-social-outline" size={24} color="#555" />
              <Text style={styles.socialText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  // Optionally filter features by category.
  const filteredFeatures = features.filter(item =>
    selectedCategory ? item.category === selectedCategory : true
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Image source={{ uri: 'https://placekitten.com/100/100' }} style={styles.profilePic} />
        <Text style={styles.appTitle}>My Social Feed</Text>
        <TouchableOpacity style={styles.newPostButton} onPress={() => router.push('/newPost')}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* Filter Row */}
      <View style={styles.filter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.addItem} onPress={() => router.push('/addFeature')}>
            <Ionicons name="add-sharp" size={20} color={'white'} />
            <Text style={{ color: 'white' }}> Add item </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterItem, selectedCategory === '' && styles.selectedFilter]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={{ color: 'white' }}>All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <FlatList
        data={filteredFeatures}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.container}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4267B2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  appTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  newPostButton: {
    backgroundColor: '#D8C9AE',
    padding: 8,
    borderRadius: 20,
  },
  filter: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  addItem: {
    backgroundColor: '#D8C9AE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterItem: {
    backgroundColor: '#D8C9AE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedFilter: {
    backgroundColor: '#B0A18D',
  },
  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    flexDirection: 'column',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#575757',
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    color: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#575757',
  },
  topic: {
    fontSize: 16,
    color: '#575757',
    lineHeight: 20,
    marginVertical: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  socialBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SocialFeed;
