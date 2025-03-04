import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { AuthContext } from './Contexts/AuthContext';

const AddItem = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState()
  const [images, setImages] = useState([]);
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'You need to grant access to your media library');
    }
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert('Camera permission required', 'You need to grant access to your camera');
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // This allows multiple images
      quality: 1,
    });

    if (!result.cancelled && result.assets) {
      setImages(result.assets); // Use `assets` instead of `selected`
    } else {
      Alert.alert('No images selected');
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || images.length === 0) {
      Alert.alert('All fields are required');
      return;
    }

    if (isNaN(price)) {
      Alert.alert('Invalid price', 'Please enter a valid price');
      return;
    }

    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        name: `image-${index}.jpg`,
        type: 'image/jpeg',
      });
    });
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category)
    formData.append('description', description);

    try {
      const response = await fetch('https://ficedu.onrender.com/shop/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${userToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Item added successfully');
        router.push('/shop')
        setName('');
        setPrice('');
        setDescription('');
        setCategory('')
        setImages([]);
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to add item. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Item</Text>
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
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  imagePreview: {
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 5,
  },
});

export default AddItem;
