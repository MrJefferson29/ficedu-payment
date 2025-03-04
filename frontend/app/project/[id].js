import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Get screen dimensions
const { width: screenWidth } = Dimensions.get("window");

const projectsData = [
    {
        id: 1,
        goal: "300,000 CFA",
        content:
            'The project "Building a Bamesing Corporative Credit Union" aims to establish a financial institution for the Bamesing community to provide access to affordable credit, savings accounts, and other financial services. This credit union will help community members grow their businesses, manage finances, and improve their economic conditions, ultimately strengthening the financial independence of the Bamesing population.',
        location: "Buea",
        topic: "Building a Bamesing Corporative Credit Union",
        image: require("../../assets/images/1.jpeg"),
        head: 'Mr Ndifon George',
    },
    {
        id: 2,
        goal: "500,000 CFA",
        content:
            "Rebuilding the Bamesing Cultural Town Center is an essential project to preserve the rich cultural heritage of the Bamesing people. The town center will become a hub for community events, cultural festivals, and workshops, allowing locals and visitors to learn about Bamesing history, arts, and crafts. The goal is to revitalize this area, making it a vibrant and welcoming space for all to enjoy and celebrate cultural diversity.",
        location: "Bamesing",
        topic: "Rebuild the Bamesing Cultural Town Center",
        image: require("../../assets/images/2.jpeg"),
        head: 'Mr Godson Melanie',
    },
    {
        id: 3,
        goal: "150,000 CFA",
        content:
            "The Annual Ekuji Ekiti Festival in Nsei-Nsem is a vital cultural event that celebrates the traditions and heritage of the local community. This project will fund the organization of the festival, bringing together people from various regions to participate in dances, music performances, food stalls, and storytelling. The goal is to preserve these cultural practices and foster unity within the community while attracting tourism to the region.",
        location: "Bamesing",
        topic: "The Annual Ekuji Ekiti Festival in Nsei-Nsem",
        image: require("../../assets/images/1.jpeg"),
        head: 'Mr George Emusun',

    },
    {
        id: 4,
        goal: "400,000 CFA",
        content:
            "The Bamesing Health Center for the Blind and Disabled aims to provide medical care and rehabilitation services to individuals with disabilities, particularly those who are blind or visually impaired. This project will establish a facility equipped with the necessary tools and staff to assist in the rehabilitation and integration of these individuals into society. The goal is to empower disabled persons in the community by offering them health services, vocational training, and emotional support.",
        location: "Douala",
        topic: "Bamesing Health Center for the Blind and Disabled",
        image: require("../../assets/images/2.jpeg"),
        head: 'Dr Hycinth Lukas',

    },
];

const ProjectDetails = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Fetch the dynamic id from the route

    const project = projectsData.find((item) => item.id === parseInt(id, 10));

    if (!project) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Project not found!</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image source={project.image} style={styles.image} />
            <View style={styles.contentContainer}>
                <Text style={styles.title}>{project.topic}</Text>
                <View style={styles.line}></View>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={25} color="#D8C9AE" />
                            <Text style={styles.locationText}>{project.location} </Text>
                        </View>
                        <Text style={styles.goal}>Goal: {project.goal}</Text>
                    </View>
                    <View>
                        <Text style={styles.locationText}>Project Chiarman </Text>
                        <Text style={styles.head}>{project.head} </Text>
                    </View>
                </View>
                <Text style={styles.content}>{project.content}</Text>
                <TouchableOpacity style={styles.support} onPress={()=> router.push('/support')}>
                    <Text style={{fontSize: 17, color: '#575757'}}>Support This Project  </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default ProjectDetails;

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    image: {
        width: '100%',
        height: 275,
        marginBottom: 15,
    },
    contentContainer: {
        width: "100%",
        paddingHorizontal: 10,
    },
    line: {
        borderWidth: 0.2,
        borderColor: '#575757',
        marginVertical: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#4A4A4A",
        marginBottom: 10,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    locationText: {
        marginLeft: 5,
        fontSize: 18,
        color: "#575757",
    },
    goal: {
        fontSize: 20,
        color: "#D8C9AE",
        marginBottom: 15,
    },
    head: {
        fontSize: 20,
        color: "#D8C9AE",
        marginTop: 10,
    },
    content: {
        fontSize: 17,
        lineHeight: 24,
        color: "#575757",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        backgroundColor: "#D8C9AE",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backButtonText: {
        marginLeft: 10,
        fontSize: 16,
        color: "#FFF",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        fontSize: 18,
        color: "red",
    },
    support: {
        width: '100%',
        marginVertical: 20,
        backgroundColor: '#D8C9AE',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
