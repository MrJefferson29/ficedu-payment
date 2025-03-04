import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { AuthContext } from './Contexts/AuthContext';

const CultureScreen = () => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const { userToken, isLoading, removeToken } = useContext(AuthContext);

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

    // Filter based on both search term and selected category
    const filteredFeatures = features.filter(feature =>
        feature.notes.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory ? feature.category === selectedCategory : true)
    );

    const router = useRouter();
    const videoRef = useRef(null);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            accessible={true}
            onPress={() => router.push(`/culture/${item._id}`)}
        >
            <View style={styles.videoContainer}>
                <Video
                    ref={videoRef}
                    source={{ uri: `https://pac-app-hj5l.onrender.com/${item.files[0]}` }}
                    style={styles.video}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                    shouldPlay={false}
                    isMuted={true}
                />
                <Ionicons
                    name="play"
                    size={40}
                    style={styles.playIcon}
                    accessibilityLabel="Play Video"
                />
            </View>
            <View style={styles.text}>
                <View style={styles.icon}>
                    <Ionicons name="compass" size={30} color={'#D8C9AE'} />
                    <Text> {item.category} </Text>
                </View>
                <Text style={styles.topic}>{item.notes}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>{editDate(item.createdAt)}</Text>
            </View>
        </TouchableOpacity>
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
        <View style={{ flex: 1 }}>
            <View style={styles.header}>
                <Text style={styles.subtitle}>Learn everything there is, about the Bamessing culture</Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#AAA" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search"
                        placeholderTextColor="#AAA"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>
            <View style={styles.filter}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {userToken?.role === 'admin' && (  // Only show if the user is an admin
                        <TouchableOpacity style={styles.addItem} onPress={() => router.push('/addFeature')}>
                            <Ionicons name="add-sharp" size={20} color={'white'} />
                            <Text style={{ color: 'white' }}> Add item </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === '' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('')}
                    >
                        <Text style={{ color: 'white' }}>All </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'History' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('History')}
                    >
                        <Text style={{ color: 'white' }}>History </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Art' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Art')}
                    >
                        <Text style={{ color: 'white' }}>Art and Craft </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Dance' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Dance')}
                    >
                        <Text style={{ color: 'white' }}>Music and Dance </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Religion' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Religion')}
                    >
                        <Text style={{ color: 'white' }}>Traditional Beliefs and Religions </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Clothing' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Clothing')}
                    >
                        <Text style={{ color: 'white' }}>Clothing and Textiles </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Cuisine' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Cuisine')}
                    >
                        <Text style={{ color: 'white' }}>Cuisine </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Social' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Social')}
                    >
                        <Text style={{ color: 'white' }}>Social Customs </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Festival' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Festival')}
                    >
                        <Text style={{ color: 'white' }}>Festivals and Celebrations </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Architecture' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Architecture')}
                    >
                        <Text style={{ color: 'white' }}>Architecture </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Education' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Education')}
                    >
                        <Text style={{ color: 'white' }}>Education and Knowledge </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Medicine' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Medicine')}
                    >
                        <Text style={{ color: 'white' }}>Traditional Medicine </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Heritage' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Heritage')}
                    >
                        <Text style={{ color: 'white' }}>Cultural Heritage and Identity </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterItem, selectedCategory === 'Community' && styles.selectedFilter]}
                        onPress={() => setSelectedCategory('Community')}
                    >
                        <Text style={{ color: 'white' }}>Community Governance </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
            <FlatList
                data={filteredFeatures}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.container}
            />
        </View>
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
        backgroundColor: '#fff',
        padding: 10,
        height: 140,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        display: 'flex',
        flexDirection: 'row',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 5,
    },
    videoContainer: {
        width: 125,
        height: 125,
        backgroundColor: '#D8C9AE',
        borderRadius: 8,
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    video: {
        width: 125,
        height: 125,
        borderRadius: 8,
    },
    playIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
        color: '#fff',
    },
    text: {
        justifyContent: 'space-around',
        flex: 1,
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
    header: {
        backgroundColor: '#4A4A4A',
        width: '100%',
        height: 200,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#D8C9AE',
        marginTop: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#4A4A4A',
    },
    filter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
    },
    addItem: {
        fontSize: 14,
        fontWeight: '500',
        flexDirection: 'row',
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
        marginRight: 10,
    },
    filterItem: {
        fontSize: 14,
        color: 'white',
        fontWeight: '500',
        flexDirection: 'row',
        backgroundColor: '#D8C9AE',
        padding: 10,
        borderRadius: 15,
        marginHorizontal: 10,
    },
    selectedFilter: {
        backgroundColor: '#4A4A4A',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CultureScreen;
