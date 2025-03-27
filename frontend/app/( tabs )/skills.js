import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Pressable,
  Image,
  Linking,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { DrawerLayoutAndroid } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../Contexts/AuthContext"; // Adjust path if needed

const Skills = () => {
  // Retrieve both userToken and userEmail from AuthContext
  const { userToken, userEmail } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State to track if a matching payment record exists
  const [paymentFound, setPaymentFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check payment status only if userEmail exists
    if (userEmail) {
      checkPaymentStatus();
    }
    fetchCourses();
  }, [userEmail]);

  // Check if a payment exists with the provided email and the exact description "RELEVANT SKILL"
  const checkPaymentStatus = async () => {
    try {
      const response = await axios.post(
        "https://ficedu-payment.onrender.com/process/get-payment",
        {
          email: userEmail,
          description: "RELEVANT SKILL",
        }
      );
      // Assuming the endpoint returns an array of matching payments if found
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setPaymentFound(true);
      } else {
        setPaymentFound(false);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      Alert.alert("Error", "Unable to verify payment status.");
      setPaymentFound(false);
    }
  };

  // Fetch courses from the backend
  const fetchCourses = async () => {
    try {
      const response = await axios.post("https://ficedu.onrender.com/courses/get-all");
      setCourses(response.data.data);
    } catch (err) {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh handler: refresh both payment status and courses list
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkPaymentStatus(), fetchCourses()]);
    setRefreshing(false);
  };

  // Drawer layout with header
  const DrawerWithHeader = ({ children }) => {
    const drawerRef = useRef(null);

    const renderDrawerContent = () => (
      <View style={styles.drawerContent}>
        {/* Add your drawer menu items here */}
      </View>
    );

    const handlePress = async (url) => {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open the URL: ${url}`);
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
          <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
            <Ionicons name="chevron-back" color="#fff" size={30} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>First Choice Education</Text>
          </View>
        </View>
        {children}
      </DrawerLayoutAndroid>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
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

  return (
    <DrawerWithHeader>
      {/* Render payment banner if no matching payment is found */}
      {!paymentFound && (
        <View style={styles.bannerBox}>
          <TouchableOpacity onPress={() => router.push({
            pathname: "/payment",
            params: {description: 'RELEVANT SKILLS'}
          })}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Access All Courses</Text>
              <Text style={styles.bannerPrice}>30,000 XAF</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Courses List with pull-to-refresh */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!paymentFound) {
                Alert.alert("Access Denied", "Please complete your payment to access courses.");
                return;
              }
              router.push({
                pathname: `/chapters/[id]`,
                params: { id: item._id, heading: item.name },
              });
            }}
          >
            <View style={styles.courseWrapper}>
              <Image source={{ uri: item.images[0] }} style={styles.courseImage} />
              {/* Show lock overlay only if payment is not found */}
              {!paymentFound && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
              )}
              <View style={styles.overlay}>
                <Text style={styles.courseName}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </DrawerWithHeader>
  );
};

const theme = {
  primary: "#4287f5",
  secondary: "#f8f9fa",
  accent: "#FFD700",
  error: "#dc3545",
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: theme.error,
    fontSize: 16,
  },
  header: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#575757",
    elevation: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  drawerContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  bannerBox: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    marginVertical: 20,
    marginHorizontal: 10,
    padding: 15,
    alignItems: "center",
  },
  bannerContent: {
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  bannerPrice: {
    fontSize: 16,
    color: theme.accent,
    marginTop: 5,
  },
  courseWrapper: {
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  courseImage: {
    width: "100%",
    height: 150,
  },
  lockOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 20,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  courseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 3,
  },
  category: {
    fontSize: 14,
    color: theme.secondary,
  },
});

export default Skills;
