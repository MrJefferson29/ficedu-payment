import React, { useContext, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AuthContext } from "../Contexts/AuthContext";

export default function TabLayout() {
  const { userToken, isLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !userToken) {
      // Redirect to login screen if the user is not authenticated
      router.push("/login");
    }
  }, [userToken, isLoading, router]);

  // If loading or unauthenticated, prevent rendering the tabs
  if (isLoading || !userToken) {
    return null; // You can also show a loading spinner here if you'd like
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#4287f5",
          tabBarInactiveTintColor: "#888",
          tabBarHideOnKeyboard: true, // Hide tab bar when keyboard is open
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={color}
                size={25}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                color={color}
                size={25}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="skills"
          options={{
            title: "Skills",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bulb" : "bulb-outline"}
                color={color}
                size={30}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat AI",
            tabBarStyle: { display: "none" },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                color={color}
                size={25}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="discovery"
          options={{
            title: "Discovery",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "compass" : "compass-outline"}
                color={color}
                size={25}
              />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopColor: "transparent",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: 60,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    position: "absolute",
  },
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
});
