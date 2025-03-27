import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import Loading from '../loading';

export default function ItemDetail() {
  const [item, setItem] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  if (!id) {
    return <Text>Invalid ID or no ID provided</Text>;
  }

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        const response = await axios.get(`http://192.168.121.1:5000/shop/${id}`);
        const itemData = response.data.data;
        setItem(itemData);
        if (itemData.author) {
          setAuthor(itemData.author);
        }
      } catch (err) {
        setError('Failed to fetch item details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetail();
    }
  }, [id]);

  const handleCallPress = () => {
    if (author?.phone) {
      Linking.openURL(`tel:${author.phone}`);
    } else {
      alert('Phone number not available');
    }
  };

  const handleWhatsappPress = () => {
    if (author?.whatsapp) {
      Linking.openURL(`whatsapp://send?phone=${author.whatsapp}`);
    } else {
      alert('WhatsApp number not available');
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {item && (
        <>
          {/* Image Carousel */}
          <Swiper style={styles.wrapper} showsButtons={false} autoplay={true} autoplayTimeout={7} showsPagination={false}>
            {item.images.map((image, index) => (
              <View key={index} style={styles.slide}>
                <Image source={{ uri: image }} style={styles.image} />
              </View>
            ))}
          </Swiper>

          <View style={styles.content}>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={handleCallPress}>
                <Ionicons name="call-outline" size={25} color="white" />
                <Text style={styles.buttonText}>Telephone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleWhatsappPress}>
                <Ionicons name="logo-whatsapp" size={25} color="white" />
                <Text style={styles.buttonText}>Whatsapp</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>XAF {item.price}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  wrapper: {
    height: 320, // Remove any space above the image by setting this directly to the image's height
    marginTop: 0, // Ensure no top margin or padding
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  content: {
    padding: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#575757',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    borderRadius: 7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 15,
    color: '#D8C9AE',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    color: '#575757',
  },
  price: {
    fontSize: 20,
    color: '#575757',
    marginTop: 10,
    width: 105,
    fontWeight: '400',
  },
  description: {
    fontSize: 16,
    color: '#4A4A4A',
    marginTop: 15,
    lineHeight: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
