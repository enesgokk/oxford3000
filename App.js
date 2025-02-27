import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import oxford3000 from "./assets/oxford3000.json";
import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Tab = createBottomTabNavigator();

function ToLearnScreen() {
  const [words, setWords] = useState([]);

  const loadWords = useCallback(async () => {
    try {
      const storedWords = await AsyncStorage.getItem("oxford3000");
      if (storedWords) {
        const parsedWords = JSON.parse(storedWords);
        setWords(parsedWords.filter((word) => !word.learned));
      } else {
        setWords(oxford3000.filter((word) => !word.learned));
      }
    } catch (error) {
      console.error("Error loading words:", error);
      setWords(oxford3000.filter((word) => !word.learned));
    }
  }, []);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const saveWords = async (updatedWords) => {
    try {
      await AsyncStorage.setItem("oxford3000", JSON.stringify(updatedWords));
    } catch (error) {
      console.error("Error saving words:", error);
    }
  };

  const toggleLearned = useCallback(
    async (index) => {
      const wordToUpdate = words[index];
      const allWords = await AsyncStorage.getItem("oxford3000")
        .then((data) => (data ? JSON.parse(data) : [...oxford3000]))
        .catch(() => [...oxford3000]);

      const originalIndex = allWords.findIndex(
        (w) => w.word === wordToUpdate.word
      );

      if (originalIndex !== -1) {
        allWords[originalIndex].learned = true;
        allWords[originalIndex].learnedAt = Date.now();
        await saveWords(allWords);
        setWords(words.filter((_, i) => i !== index));
      }
    },
    [words]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.card}>
        <View style={styles.wordHeader}>
          <Text style={styles.word}>{item.word}</Text>
          <TouchableOpacity onPress={() => toggleLearned(index)}>
            <MaterialIcons
              name={"radio-button-unchecked"}
              size={24}
              color={"#757575"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.pronunciation}>{item.pronunciation}</Text>
        <Text style={styles.meaning}>{item.meaning}</Text>
        <Text style={styles.example}>{item.example}</Text>
      </View>
    ),
    [toggleLearned]
  );

  const keyExtractor = useCallback((item, index) => index.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={words}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollView}
        windowSize={5}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        removeClippedSubviews={true}
      />
    </View>
  );
}

function LearnedScreen() {
  const [words, setWords] = useState([]);

  const loadWords = useCallback(async () => {
    try {
      const storedWords = await AsyncStorage.getItem("oxford3000");
      if (storedWords) {
        const parsedWords = JSON.parse(storedWords);
        const learnedWords = parsedWords.filter((word) => word.learned);
        learnedWords.sort((a, b) => (b.learnedAt || 0) - (a.learnedAt || 0));
        setWords(learnedWords);
      } else {
        setWords(oxford3000.filter((word) => word.learned));
      }
    } catch (error) {
      console.error("Error loading words:", error);
      setWords(oxford3000.filter((word) => word.learned));
    }
  }, []);

  useEffect(() => {
    loadWords();
    const interval = setInterval(loadWords, 1000);
    return () => clearInterval(interval);
  }, [loadWords]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <View style={styles.wordHeader}>
          <Text style={styles.word}>{item.word}</Text>
          <MaterialIcons name={"check-circle"} size={24} color={"#4CAF50"} />
        </View>
        <Text style={styles.pronunciation}>{item.pronunciation}</Text>
        <Text style={styles.meaning}>{item.meaning}</Text>
        <Text style={styles.example}>{item.example}</Text>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item, index) => index.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={words}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollView}
        windowSize={5}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        removeClippedSubviews={true}
      />
    </View>
  );
}

export default function App() {
  const toggleLearned = useCallback((index) => {
    setWords((prevWords) => {
      const newWords = [...prevWords];
      newWords[index].learned = !newWords[index].learned;
      return newWords;
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.card}>
        <View style={styles.wordHeader}>
          <Text style={styles.word}>{item.word}</Text>
          <TouchableOpacity onPress={() => toggleLearned(index)}>
            <MaterialIcons
              name={item.learned ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={item.learned ? "#4CAF50" : "#757575"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.pronunciation}>{item.pronunciation}</Text>
        <Text style={styles.meaning}>{item.meaning}</Text>
        <Text style={styles.example}>{item.example}</Text>
      </View>
    ),
    [toggleLearned]
  );

  const keyExtractor = useCallback((item, index) => index.toString(), []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "To Learn") {
              iconName = "school";
            } else if (route.name === "Learned") {
              iconName = "check-circle";
            }
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#4CAF50",
          tabBarInactiveTintColor: "gray",
          headerTitle:
            route.name === "To Learn" ? "Oxford 3000 Words" : "Learned Words",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#f5f5f5",
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
          },
        })}
      >
        <Tab.Screen name="To Learn" component={ToLearnScreen} />
        <Tab.Screen name="Learned" component={LearnedScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  scrollView: {
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  word: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  pronunciation: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  meaning: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  example: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
