import { Stack } from 'expo-router';
import { AuthProvider } from './Contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="( tabs )" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="addItem" options={{ headerShown: false }} />
        <Stack.Screen name="addFeature" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="ItemDetail/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="DetailScreen/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chapters/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="itemDetail/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="Archive" options={{ headerShown: false }} />
        <Stack.Screen name="Payment" options={{ headerShown: false }} />
        <Stack.Screen name="Projects" options={{ headerShown: false }} />
        <Stack.Screen name='Travel' options={{headerShown: false}} />
        <Stack.Screen name="soon" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="travel" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
