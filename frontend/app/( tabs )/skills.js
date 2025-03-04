import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet,
    ImageBackground, Pressable, TextInput, Button, Image, Alert, TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerLayoutAndroid } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';


const Skills = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [images, setImages] = useState([]);
    const [userToken, setUserToken] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const router = useRouter();

    useEffect(() => {
        requestPermissions();
        fetchUserToken();
        fetchCourses();
    }, []);

    // Request media & camera permissions
    const requestPermissions = async () => {
        const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

        if (mediaStatus !== 'granted' || cameraStatus !== 'granted') {
            Alert.alert('Permission required', 'You need to grant access to use media and camera');
        }
    };

    // Retrieve user token
    const fetchUserToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            setUserToken(token);
        } catch (error) {
            console.error('Error fetching token:', error);
        }
    };

    // Fetch courses from API
    const fetchCourses = async () => {
        try {
            const response = await axios.post('https://ficedu.onrender.com/courses/get-all');
            setCourses(response.data.data);
        } catch (err) {
            setError('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    // Open image picker
    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            setImages([...images, ...result.assets]); // Append selected images
        } else {
            Alert.alert('No images selected');
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!name || !price || !category || images.length === 0) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        if (isNaN(price)) {
            Alert.alert('Invalid price', 'Please enter a valid number for price');
            return;
        }

        if (!userToken) {
            Alert.alert('Error', 'Authentication required');
            return;
        }

        const formData = new FormData();

        // Convert image URI to a format Cloudinary can accept
        for (let i = 0; i < images.length; i++) {
            const response = await fetch(images[i].uri);
            const blob = await response.blob();

            formData.append('images', {
                uri: images[i].uri,
                name: `image-${Date.now()}-${i}.jpg`,
                type: 'image/jpeg',
            });
        }

        formData.append('name', name);
        formData.append('price', price);
        formData.append('category', category);

        try {
            const response = await fetch('https://ficedu.onrender.com/courses/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Course added successfully');
                router.push('/categories');
                setName('');
                setPrice('');
                setCategory('');
                setImages([]);
                setIsFormVisible(false);
            } else {
                Alert.alert('Error', data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to add course. Please try again later.');
        }
    };

    const toggleFormVisibility = () => {
        setIsFormVisible(!isFormVisible);
    };

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

    const DrawerWithHeader = ({ children }) => {
        const drawerRef = useRef(null);

        const renderDrawerContent = () => (
            <View style={styles.drawerContent}>
            </View>
        );

        const handlePress = async (url) => {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Cannot open the URL: ${url}`);
            }
        };

        return (
            <DrawerLayoutAndroid
                ref={drawerRef}
                drawerWidth={250}
                drawerPosition="left"
                renderNavigationView={renderDrawerContent}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/')} style={styles.circle}>
                       <Ionicons name='chevron-back' color={'white'} size={30} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>First Choice Education</Text>
                    </View>
                </View>
                {children}
            </DrawerLayoutAndroid>
        );
    };
    return (
        <DrawerWithHeader style={styles.container}>
            <TouchableOpacity onPress={() => router.push('/payment')}><Text>Hello Wold</Text></TouchableOpacity>
            <FlatList
                data={courses}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push({
                            pathname: `/videos/[id]`,  // Use dynamic route
                            params: { id: item._id, heading: item.name },  // Pass dynamic params
                        })}
                    >
                        <ImageBackground
                            source={{ uri: `${item.images[0]}` }}
                            style={styles.card}
                            imageStyle={styles.imageBackground}
                        >
                            <View style={styles.overlay}>
                                <Text style={styles.courseName}>{item.name}</Text>
                                <Text style={styles.category}>{item.category}</Text>
                                <Text style={styles.price}>XAF {item.price}</Text>
                            </View>
                        </ImageBackground>
                    </Pressable>

                )}
            />

            {/* Toggle button */}
            {/* <Pressable onPress={toggleFormVisibility} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>Add Course</Text>
            </Pressable> */}

            {/* Form Dropdown
            {isFormVisible && (
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Item Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Price"
                        value={price}
                        keyboardType="numeric"
                        onChangeText={setPrice}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Category"
                        value={category}
                        onChangeText={setCategory}
                    />
                    <Button title="Pick Images" onPress={pickImages} />
                    <View style={styles.imagePreview}>
                        {images.length > 0 ? (
                            images.map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image.uri }}
                                    style={styles.image}
                                />
                            ))
                        ) : (
                            <Text>No images selected</Text>
                        )}
                    </View>
                    <Button title="Add Item" onPress={handleSubmit} />
                </View>
            )} */}
        </DrawerWithHeader>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8f9fa',
    },
    courseName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    category: {
        fontSize: 14,
        color: '#f8f9fa',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 5,
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
    card: {
        height: 150,
        marginVertical: 10,
        borderRadius: 5,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    imageBackground: {
        borderRadius: 10,
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 15,
    },
    input: {
        borderWidth: 1,
        padding: 8,
        marginVertical: 5,
        borderRadius: 5,
    },
    imagePreview: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    image: {
        width: 50,
        height: 50,
        marginRight: 5,
    },
    toggleButton: {
        padding: 10,
        backgroundColor: '#007bff',
        alignItems: 'center',
        marginVertical: 10,
        borderRadius: 5,
    },
    header: {
        backgroundColor: '#4287f5',
        paddingVertical: 15,
        paddingTop: 13,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#575757',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    circle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '00',
        color: 'white',
    },
});

export default Skills;
