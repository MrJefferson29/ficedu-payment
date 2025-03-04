import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import axios from 'axios';

const Features = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null); // State to track which video is playing

  const editDate = (createdAt) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const d = new Date(createdAt);
    return `${d.getDate()} ${monthNames[d.getMonth()]} ,${d.getFullYear()}`;
  };

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

  const filteredFeatures = features.filter(feature =>
    feature.notes.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory ? feature.category === selectedCategory : true)
  );

  const router = useRouter();
  const videoRef = useRef(null);

  const renderItem = ({ item, index }) => (
    <>
      <TouchableOpacity
        style={styles.card}
        accessible={true}
      >
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: `${item.files[0]}` }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            isLooping
            shouldPlay={playingVideoIndex === index} // Play the video if its index matches
            isMuted={false}
            onLoadStart={() => setIsLoadingVideo(true)}
            onLoad={() => setIsLoadingVideo(false)} 
          />
          {playingVideoIndex !== index && ( // Show the play icon if the video is not playing
            <Ionicons
              name="play"
              size={40}
              style={styles.playIcon}
              accessibilityLabel="Play Video"
              onPress={() => setPlayingVideoIndex(index)} // Set the playing video index on press
              color={'#4287f5'}
            />
          )}
        </View>
        <View style={styles.text}>
          <View style={styles.icon}>
            <Ionicons name="compass" size={30} color={'#4287f5'} />
            <Text> {item.category} </Text>
          </View>
          <Text style={styles.topic}>{item.notes}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>{editDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </>
  );

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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
      {/* <View style={styles.filter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.addItem} onPress={() => router.push('/addFeature')}>
            <Ionicons name="add-sharp" size={20} color={'white'} />
            <Text style={{ color: 'white' }}> Add item </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterItem, selectedCategory === '' && styles.selectedFilter]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={{ color: 'white' }}>All </Text>
          </TouchableOpacity>
        </ScrollView>
      </View> */}
      <FlatList
        data={filteredFeatures}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.container}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  icon: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    width: '70%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    display: 'flex',
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
    color: '#D8C9AE',
  },
  text: {
    flex: 1,
    justifyContent: 'space-around',
  },
  topic: {
    fontSize: 16,
    color: '#575757',
    lineHeight: 20,
    flexShrink: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxHeight: 40,
  },
  filter: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    backgroundColor: '#4287f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Features;
