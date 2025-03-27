import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from './Contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Loading from './loading';

const Profile = () => {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // "profile" or "referrals"

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) {
        router.push('/login');
        return;
      }
      try {
        const response = await fetch('https://ficedu.onrender.com/user/profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        const userData = data.data;
        setProfileData(userData);
        setEmail(userData.email);
        setName(userData.name);
        setOrgEmail(userData.orgemail);
        setPhone(userData.phone);
        setWhatsapp(userData.whatsapp);
        setBio(userData.bio || '');
        setReferrals(userData.referrals || []);
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userToken, router]);

  // Handle saving profile changes
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://ficedu.onrender.com/user/edit-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          orgemail: orgEmail,
          phone,
          whatsapp,
          bio,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      Alert.alert('Success', 'Profile updated successfully');
      setProfileData(data.updatedData);
      router.push('/')
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy referral code to clipboard and notify the user
  const handleCopyReferral = async () => {
    await Clipboard.setStringAsync(profileData.referralCode);
    Alert.alert('Copied', 'Referral code copied to clipboard!');
  };

  if (isLoading) {
    return (
      <Loading />
    );
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile data</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.profilePic}>
            <Image
              source={
                profileData.profilePic
                  ? { uri: profileData.profilePic }
                  : require('../assets/images/2.jpeg')
              }
              style={styles.profileImage}
            />
          </View>
          <View style={styles.names}>
            <Text style={styles.name}>{profileData.name}</Text>
            <Text style={styles.username}>@{profileData.username}</Text>
          </View>
        </View>

        {/* Tab buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'referrals' && styles.activeTab]}
            onPress={() => setActiveTab('referrals')}
          >
            <Text style={styles.tabText}>Referrals</Text>
          </TouchableOpacity>
        </View>

        {/* Tab content */}
        {activeTab === 'profile' ? (
          <View style={styles.profileContent}>
            <Text style={styles.referralHeader}>Your Referral Code:</Text>
            <View style={styles.referralBox}>
              <Text style={styles.referralCode}>{profileData.referralCode}</Text>
              <TouchableOpacity onPress={handleCopyReferral}>
                <Ionicons name="copy-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <View style={styles.contacts}>
              <Text style={styles.text}>Email</Text>
              <View style={styles.emails}>
                <View style={styles.row}>
                  <Ionicons name="mail-outline" size={40} color="#AAA" />
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Personal</Text>
                    <TextInput
                      style={styles.inputValue}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={profileData.email || 'Email'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <Ionicons name="mail-outline" size={40} color="#AAA" />
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Organization</Text>
                    <TextInput
                      style={styles.inputValue}
                      value={orgEmail}
                      onChangeText={setOrgEmail}
                      placeholder={profileData.orgemail || 'Organization Email'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>
              <View style={styles.separator} />
              <Text style={styles.text}>Mobile</Text>
              <View style={styles.numbers}>
                <View style={styles.row}>
                  <Ionicons name="call-outline" size={40} color="#AAA" />
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Telephone</Text>
                    <TextInput
                      style={styles.inputValue}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={profileData.phone || 'Telephone'}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <Ionicons name="logo-whatsapp" size={40} color="#AAA" />
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>WhatsApp</Text>
                    <TextInput
                      style={styles.inputValue}
                      value={whatsapp}
                      onChangeText={setWhatsapp}
                      placeholder={profileData.whatsapp || 'WhatsApp'}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            </View>
            <TextInput
              style={styles.bio}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short story about yourself"
              multiline
            />
          </View>
        ) : (
          <View style={styles.referralsContent}>
            {referrals.length > 0 ? (
              referrals.map((referral) => (
                <View key={referral._id} style={styles.referralItem}>
                  <Text style={styles.referralName}>{referral.name}</Text>
                  <Text style={styles.referralUsername}>@{referral.username}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noReferrals}>No referrals found</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  header: {
    backgroundColor: '#575757',
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 13,
  },
  profilePic: {
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  names: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  name: {
    fontSize: 18,
    color: '#D8C9AE',
    fontWeight: '600',
  },
  username: {
    fontSize: 16,
    color: '#D8C9AE',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#575757',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  tabText: {
    color: '#D8C9AE',
    fontWeight: '600',
    fontSize: 16,
  },
  profileContent: {
    padding: 20,
  },
  referralHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  contacts: {
    marginBottom: 20,
  },
  text: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '700',
  },
  emails: {
    marginBottom: 15,
  },
  numbers: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputGroup: {
    paddingLeft: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: '#575757',
    marginBottom: 2,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '500',
    borderBottomWidth: 0.5,
    borderColor: '#575757',
    paddingVertical: 2,
    minWidth: 200,
  },
  separator: {
    height: 1,
    backgroundColor: '#575757',
    marginVertical: 10,
  },
  bio: {
    width: '95%',
    borderColor: '#575757',
    borderWidth: 0.5,
    padding: 10,
    fontSize: 15,
    margin: 10,
    borderRadius: 8,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  button: {
    backgroundColor: '#575757',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  referralsContent: {
    padding: 20,
  },
  referralItem: {
    marginBottom: 10,
    backgroundColor: '#dedede',
    padding: 10,
    borderRadius: 8,
  },
  referralName: {
    fontWeight: '600',
    fontSize: 15,
  },
  referralUsername: {
    fontSize: 15,
    color: '#AAA',
  },
  noReferrals: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default Profile;
