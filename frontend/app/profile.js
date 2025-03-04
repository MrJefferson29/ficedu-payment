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
                setProfileData(data.data);

                setEmail(data.data.email);
                setName(data.data.name);
                setOrgEmail(data.data.orgemail);
                setPhone(data.data.phone);
                setWhatsapp(data.data.whatsapp);
                setBio(data.data.bio || '');
                setReferrals(data.data.referrals); // Directly set referrals from the response

            } catch (error) {
                Alert.alert('Error', error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userToken, router]);


    const handleSaveChanges = async () => {
        try {
            setIsLoading(true);
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
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
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
            <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
                <View style={styles.header}>
                    <View style={styles.profilePic}>
                        <Image
                            source={
                                profileData.profilePic
                                    ? { uri: profileData.profilePic }
                                    : require('../assets/images/2.jpeg')
                            }
                            style={styles.ProfileImage}
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
                            <TouchableOpacity onPress={() => Clipboard.setString(profileData.referralCode)}>
                                <Ionicons name="copy-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.contacts}>
                            <Text style={styles.text}>Email</Text>
                            <View style={styles.emails}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="mail-outline" size={40} color="#AAA" />
                                    <View style={{ paddingLeft: 5 }}>
                                        <Text style={styles.top}>Personal</Text>
                                        <TextInput
                                            style={styles.bottom}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder={profileData.email || 'Email'}
                                        />
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="mail-outline" size={40} color="#AAA" />
                                    <View style={{ paddingLeft: 5 }}>
                                        <Text style={styles.top}>Organization</Text>
                                        <TextInput
                                            style={styles.bottom}
                                            value={orgEmail}
                                            onChangeText={setOrgEmail}
                                            placeholder={profileData.orgemail || 'Organization Email'}
                                        />
                                    </View>
                                </View>
                            </View>
                            <View style={styles.line} />
                            <Text style={styles.text}>Mobile</Text>
                            <View style={styles.number}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="call-outline" size={40} color="#AAA" />
                                    <View style={{ paddingLeft: 5 }}>
                                        <Text style={styles.top}>Telephone</Text>
                                        <TextInput
                                            style={styles.bottom}
                                            value={phone}
                                            onChangeText={setPhone}
                                            placeholder={profileData.phone || 'Telephone'}
                                        />
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="logo-whatsapp" size={40} color="#AAA" />
                                    <View style={{ paddingLeft: 5 }}>
                                        <Text style={styles.top}>WhatsApp</Text>
                                        <TextInput
                                            style={styles.bottom}
                                            value={whatsapp}
                                            onChangeText={setWhatsapp}
                                            placeholder={profileData.whatsapp || 'WhatsApp'}
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
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : referrals.length > 0 ? (
                            referrals.map((referral) => (
                                <View key={referral._id} style={styles.referralItem}>
                                    <Text style={styles.referralName}>{referral.name}</Text>
                                    <Text style={styles.referralUsername}>@{referral.username}</Text>
                                </View>
                            ))
                        ) : (
                            <Text>No referrals found</Text>
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
    fixedButtonContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
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
    backwards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        padding: 10,
    },
    ProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 100,
    },
    names: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    name: {
        fontSize: 18,
        color: '#D8C9AE',
    },
    username: {
        fontWeight: '400',
        fontSize: 17,
        color: '#D8C9AE',
        marginTop: 6,
    },
    contacts: {
        marginTop: 20,
        padding: 20,
    },
    text: {
        fontSize: 15,
        marginBottom: 8,
        fontWeight: '700',
    },
    top: {
        top: 8,
        fontWeight: '400',
        left: 3,
        fontSize: 18,
    },
    bottom: {
        fontSize: 18,
        width: '100%',
        fontWeight: '500',
    },
    line: {
        height: 0.6,
        backgroundColor: '#575757',
        marginVertical: 10,
    },
    bio: {
        width: '95%',
        borderColor: '#575757',
        height: 100,
        borderWidth: 0.5,
        padding: 10,
        fontSize: 15,
        margin: 10,
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
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
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
    referralsContent: {
        padding: 20,
    },
    referralItem: {
        marginBottom: 10,
        backgroundColor: '#dedede',
        padding: 10,
    },
    referralName: {
        fontWeight: '600',
        fontSize: 15,
    },
    referralUsername: {
        fontSize: 15,
        color: '#AAA',
    },
    referralHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        paddingHorizontal: 10,
    },
    referralBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 10,
    },
    referralCode: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },

});

export default Profile;
