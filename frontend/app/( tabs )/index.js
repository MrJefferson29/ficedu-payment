import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, SafeAreaView, Button, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DrawerLayoutAndroid } from 'react-native-gesture-handler';
import { useRef } from 'react';
import Carousel from '../carousel';
import Features from '../features';



export default function Index() {
  const router = useRouter()

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
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.circle}>
            <Image source={require('../../assets/images/logo.png')} style={{width: 45, height: 45, borderRadius: 70}} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>First Choice Education</Text>
            <Text style={styles.headerSubtitle}>
              Hosted by{' '}
              <Text
                style={{ color: 'teal', fontWeight: '900', textDecorationLine: 'underline' }}
                onPress={() => handlePress('https://tentrade.com/')}
              >
                TenTrade
              </Text>
            </Text>
          </View>
        </View>
        {children}
      </DrawerLayoutAndroid>
    );
  };

  return (
    <DrawerWithHeader>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <Carousel />
          {/* Content Section */}
          <View style={styles.content}>
            {/* First Row */}
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/categories')}
              >
                <Text style={styles.cardText}>Past Q&A</Text>
                <View style={styles.icon}>
                  <Ionicons name="document" size={24} color="#4287f5" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/travel')}
              >
                <Text style={styles.cardText}>Travel Abroad</Text>
                <View style={styles.icon}>
                  <Ionicons name="airplane" size={24} color="#4287f5" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Second Row */}
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/skills')}
              >
                <Text style={styles.cardText}>Relevant Skills</Text>
                <View style={styles.icon}>
                  <Ionicons name="school" size={24} color="#4287f5" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/discovery')}
              >
                <Text style={styles.cardText}>Self Discovery</Text>
                <View style={styles.icon}>
                  <Ionicons name="person" size={24} color="#4287f5" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.heading}>How to study</Text>
          <View>
            <Features />
          </View>
        </ScrollView>
      </SafeAreaView>
    </DrawerWithHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  adContainer: {
    backgroundColor: '#575757',
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginTop: 35
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -25,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    width: '48%',
    height: 96,
    borderRadius: 10,
    borderWidth: 0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    padding: 10,
    position: 'relative',
  },
  cardText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#575757',
  },
  subText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  icon: {
    backgroundColor: 'none',
    width: 37,
    height: 37,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderWidth: 0.7,
    borderColor: '#575757'
  },
  heading: {
    marginTop: 20,
    fontSize: 25,
    color: '#575757',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
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
    color: '#333333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '00',
    color: '#666666',
  },
});
