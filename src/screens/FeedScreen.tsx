import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,   
  StatusBar, 
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';

// --- Types ---
type FeedPost = {
  id: string;
  trainerName: string;
  pokemonName: string;
  pokemonImage: string;
  caption: string;
  timestamp: number;
  likes: number;
};

type MyPokemon = {
  id: number;
  name: string;
  imageUrl: string;
};

// --- STATIC MOCK DATA (Temporary) ---
const mockPosts: FeedPost[] = [
  {
    id: 'mock-1',
    trainerName: 'Ash Ketchum',
    pokemonName: 'Pikachu',
    pokemonImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    caption: 'My best buddy forever! ⚡️ We are going to be the very best!',
    timestamp: Date.now(),
    likes: 152,
  },
  {
    id: 'mock-2',
    trainerName: 'Misty',
    pokemonName: 'Starmie',
    pokemonImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/121.png',
    caption: 'The gem of the sea. Water types are simply the most elegant.',
    timestamp: Date.now() - 3600000, // 1 hour ago
    likes: 89,
  },
];

const FeedScreen = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Posting State
  const [modalVisible, setModalVisible] = useState(false);
  const [myPokemonList, setMyPokemonList] = useState<MyPokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<MyPokemon | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const currentUser = auth().currentUser;

  // 1. Listen to the Global Feed
  useEffect(() => {
    const feedRef = database().ref('/public_feed').limitToLast(50);

    const onValueChange = feedRef.on('value', (snapshot) => {
      const data = snapshot.val();
      let realPosts: FeedPost[] = [];

      if (data) {
        // Convert object to array and reverse (newest first)
        realPosts = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => b.timestamp - a.timestamp);
      }
      
      // COMBINE: Add mock posts to the list so you can see them!
      // (Real posts first, then static ones for this demo)
      setPosts([...realPosts, ...mockPosts]);
      setLoading(false);
    });

    return () => feedRef.off('value', onValueChange);
  }, []);

  // 2. Fetch My Pokemon (for the "New Post" modal)
  const fetchMyPokemon = async () => {
    if (!currentUser) return;
    try {
      const snapshot = await database()
        .ref(`/users/${currentUser.uid}/discoveredPokemon`)
        .once('value');
      
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as MyPokemon[];
        setMyPokemonList(list);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openPostModal = () => {
    fetchMyPokemon();
    setModalVisible(true);
  };

  // 3. Handle Create Post
  const handlePost = async () => {
    if (!selectedPokemon || !currentUser) {
      Alert.alert('Select a Pokemon', 'You must choose a Pokemon to share!');
      return;
    }

    setPosting(true);
    try {
      // Fetch user's name first
      const userSnap = await database().ref(`/users/${currentUser.uid}/trainerName`).once('value');
      const trainerName = userSnap.val() || 'Unknown Trainer';

      const newPostRef = database().ref('/public_feed').push();
      await newPostRef.set({
        trainerName,
        pokemonName: selectedPokemon.name,
        pokemonImage: selectedPokemon.imageUrl,
        caption: caption,
        timestamp: database.ServerValue.TIMESTAMP,
        likes: 0,
        userId: currentUser.uid,
      });

      setModalVisible(false);
      setCaption('');
      setSelectedPokemon(null);
      Alert.alert('Success', 'Discovery posted to the feed!');
    } catch (error) {
      Alert.alert('Error', 'Could not post.');
    }
    setPosting(false);
  };

  // 4. Handle Social Share (Instagram, WhatsApp, etc.)
  const onShare = async (post: FeedPost) => {
    const shareOptions = {
      title: 'PokeExplorer Discovery',
      message: `Check out this ${post.pokemonName} caught by ${post.trainerName} in PokeExplorer!`,
      url: post.pokemonImage, 
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.log('Share dismissed');
    }
  };

  // --- Render Single Post ---
  const renderItem = ({ item }: { item: FeedPost }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.trainerName}>{item.trainerName}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Image */}
      <Image source={{ uri: item.pokemonImage }} style={styles.cardImage} resizeMode="contain" />

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="heart-outline" size={26} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)}>
          <MaterialCommunityIcons name="share-variant-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.cardContent}>
        <Text style={styles.postText}>
          <Text style={styles.boldText}>{item.pokemonName} </Text>
          {item.caption}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Feed</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e63946" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No discoveries yet. Be the first!</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openPostModal}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      {/* --- CREATE POST MODAL --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share a Discovery</Text>

            <Text style={styles.label}>Select a Pokémon:</Text>
            {myPokemonList.length === 0 ? (
              <Text style={styles.emptyText}>You haven't caught any Pokemon yet!</Text>
            ) : (
              <FlatList
                data={myPokemonList}
                horizontal
                style={{ maxHeight: 120, marginBottom: 20 }}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedPokemon(item)}
                    style={[
                      styles.pokemonOption,
                      selectedPokemon?.id === item.id && styles.selectedOption,
                    ]}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.optionImage} />
                    <Text style={styles.optionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Write a caption..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.postBtn]}
                onPress={handlePost}
                disabled={posting}
              >
                <Text style={styles.btnText}>{posting ? 'Posting...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333333',
  },
  header: {
    backgroundColor: '#8B2323',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingTop: 15,//Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 50,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#444',
    marginBottom: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#888',
    marginRight: 10,
  },
  trainerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
  },
  cardImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#555',
  },
  cardActions: {
    flexDirection: 'row',
    padding: 10,
  },
  actionBtn: {
    marginRight: 15,
  },
  cardContent: {
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  postText: {
    color: '#eee',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#e63946',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    color: '#ccc',
    marginBottom: 10,
  },
  pokemonOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#e63946',
    backgroundColor: '#333',
  },
  optionImage: {
    width: 60,
    height: 60,
    marginBottom: 5,
  },
  optionText: {
    color: '#fff',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#555',
  },
  postBtn: {
    backgroundColor: '#e63946',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FeedScreen;