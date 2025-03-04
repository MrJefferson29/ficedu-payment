import { React, useContext, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../Contexts/AuthContext'; // Assuming you have the AuthContext in the same directory
import { useRouter } from 'expo-router';


export default function TabLayout() {
  const { userToken, isLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !userToken) {
      // Redirect to login screen if the user is not authenticated
      router.push('/login');
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
          tabBarActiveTintColor: '#4287f5',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            headerShown: false,
            title: 'Shop',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cart' : 'cart-outline'} color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="skills"
          options={{
            headerShown: false,
            title: 'Relevant Skills',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'bulb' : 'bulb-outline'} color={color} size={30} />
            ),
          }}
        />
        <Tabs.Screen
          name="discovery"
          options={{
            headerShown: false,
            title: 'Self Discovery',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={25} />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="categories"
          options={{
            headerShown: false,
            title: 'Q & A',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={25} />
            ),
          }}
        /> */}
      </Tabs>
    </GestureHandlerRootView>
  );
}
