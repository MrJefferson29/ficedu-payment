import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";

const Chat = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem("chatMessages");
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error("Failed to load messages from AsyncStorage:", error);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;
    Keyboard.dismiss();

    const userMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text: prompt,
      sender: "user",
      timestamp: moment().format("h:mm A"),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setPrompt("");
    setLoading(true);
    setTyping(true);

    try {
      // Note: Ensure that the URL matches your backend server address.
      const response = await axios.post("http://192.168.121.1:5000/ai/generate", { prompt });
      // Updated to use the "text" key from the backend
      const aiResponse = response.data.text || "Sorry, something went wrong.";

      const aiMessage = {
        id: `${Date.now()}-${Math.random()}`,
        text: "",
        sender: "ai",
        timestamp: moment().format("h:mm A"),
      };

      updatedMessages.push(aiMessage);
      setMessages([...updatedMessages]);

      // Display the AI response letter-by-letter
      for (let i = 0; i < aiResponse.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        aiMessage.text += aiResponse[i];
        setMessages([...updatedMessages]);
      }

      await AsyncStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage = {
        id: `${Date.now()}-${Math.random()}`,
        text: "Sorry, something went wrong.",
        sender: "ai",
        timestamp: moment().format("h:mm A"),
      };
      updatedMessages.push(errorMessage);
      setMessages([...updatedMessages]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVisible ? 30 : 0}
    >
      <View style={styles.innerContainer}>
        <FlatList
          ref={flatListRef}
          data={[
            ...messages,
            ...(typing ? [{ id: "typing", sender: "ai", text: "Typing...", timestamp: "" }] : []),
          ]}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.sender === "ai" ? styles.aiMessage : styles.userMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
              {item.timestamp ? (
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              ) : null}
            </View>
          )}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
        <View style={styles.scrollButtonContainer}>
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
          >
            <Ionicons name="arrow-down" size={24} color="#075E54" />
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.sendButton, (!prompt.trim() || loading) && { opacity: 0.5 }]}
              disabled={!prompt.trim() || loading}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ece5dd", // WhatsApp-like background
  },
  innerContainer: {
    flex: 1,
    padding: 10,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  message: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 10,
    marginHorizontal: 10,
    // Shadows for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    // Elevation for Android
    elevation: 2,
  },
  userMessage: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 0,
  },
  aiMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: "#303030",
  },
  timestamp: {
    fontSize: 10,
    color: "#555",
    textAlign: "right",
    marginTop: 4,
  },
  inputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Semi-transparent background
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#303030",
    paddingVertical: 4,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#075E54",
    padding: 10,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollButtonContainer: {
    position: "absolute",
    bottom: 90,
    right: 15,
  },
  scrollButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
});

export default Chat;
