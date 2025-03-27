import React, { useEffect, useState } from "react";
import { StyleSheet, Animated, Easing } from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Loading() {
  // Animated value for rotation
  const spinValue = new Animated.Value(0);
  // Animated value for text fade-in
  const fadeAnim = new Animated.Value(0);
  const [loadingText, setLoadingText] = useState("Please wait...");

  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    // Fade in animation for text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Rotate through professional status messages
    const loadingMessages = [
      "Loading resources...",
      "Configuring workspace...",
      "Finalizing setup...",
      "Almost there..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      setLoadingText(loadingMessages[index]);
      index = (index + 1) % loadingMessages.length;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Interpolating rotation animation value to degrees
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient colors={["#2c3e50", "#34495e"]} style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <LottieView
          source={{ uri: "https://assets10.lottiefiles.com/packages/lf20_Cc8Bpg.json" }}
          autoPlay
          loop
          style={styles.lottie}
        />
      </Animated.View>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        {loadingText}
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 120,
    height: 120,
  },
  text: {
    fontSize: 18,
    color: "#ecf0f1",
    marginTop: 20,
    fontWeight: "500",
  },
});

