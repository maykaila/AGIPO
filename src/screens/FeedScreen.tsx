import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,   
  StatusBar,
  KeyboardAvoidingView 
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';

// --- Types ---
type Comment = {
  id: string;
  username: string;
  text: string;
  timestamp: number;
};

type FeedPost = {
  id: string;
  trainerName: string;
  pokemonName: string;
  pokemonImage: string;
  caption: string;
  timestamp: number;
  likes: number;
  comments?: { [key: string]: Comment }; // Dictionary of comments
};

type MyPokemon = {
  id: number;
  name: string;
  imageUrl: string;
};

const FeedScreen = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- States for Creating Post ---
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [myPokemonList, setMyPokemonList] = useState<MyPokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<MyPokemon | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  // --- States for Comments ---
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  // We derive the active post's comments from the main 'posts' state

  const currentUser = auth().currentUser;

  // 1. Listen to Feed Data
  useEffect(() => {
    const feedRef = database().ref('/public_feed').limitToLast(50);

    const onValueChange = feedRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedPosts: FeedPost[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setPosts(parsedPosts);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => feedRef.off('value', onValueChange);
  }, []);

  // --- LOGIC: CREATE POST ---
  const fetchMyPokemon = async () => {
    if (!currentUser) return;
    try {
      const snapshot = await database()
        .ref(`/users/${currentUser.uid}/discoveredPokemon`)
        .once('value');
      const data = snapshot.val();
      if (data) {
        setMyPokemonList(Object.values(data) as MyPokemon[]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openCreateModal = () => {
    fetchMyPokemon();
    setCreateModalVisible(true);
  };

  const handlePost = async () => {
    if (!selectedPokemon || !currentUser) {
      Alert.alert('Missing Info', 'Please select a Pokemon to share.');
      return;
    }
    setPosting(true);
    try {
      const userSnap = await database().ref(`/users/${currentUser.uid}/trainerName`).once('value');
      const trainerName = userSnap.val() || 'Unknown Trainer';

      await database().ref('/public_feed').push({
        trainerName,
        pokemonName: selectedPokemon.name,
        pokemonImage: selectedPokemon.imageUrl,
        caption: caption,
        timestamp: database.ServerValue.TIMESTAMP,
        likes: 0,
        userId: currentUser.uid,
      });

      setCreateModalVisible(false);
      setCaption('');
      setSelectedPokemon(null);
      Alert.alert('Posted!', 'Your discovery is now live.');
    } catch (error) {
      Alert.alert('Error', 'Could not post to feed.');
    }
    setPosting(false);
  };

  // --- LOGIC: LIKE POST ---
  const handleLike = (postId: string) => {
    const postRef = database().ref(`/public_feed/${postId}/likes`);
    postRef.transaction((currentLikes) => {
      return (currentLikes || 0) + 1;
    });
  };

  // --- LOGIC: COMMENTING ---
  const openCommentModal = (post: FeedPost) => {
    setActivePostId(post.id);
    setCommentModalVisible(true);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !activePostId || !currentUser) return;

    try {
      const userSnap = await database().ref(`/users/${currentUser.uid}/trainerName`).once('value');
      const username = userSnap.val() || 'Trainer';

      const commentsRef = database().ref(`/public_feed/${activePostId}/comments`);
      await commentsRef.push({
        username,
        text: newComment.trim(),
        timestamp: database.ServerValue.TIMESTAMP,
      });
      setNewComment('');
    } catch (error) {
      console.error(error);
    }
  };

  // --- LOGIC: SHARE ---
  const onShare = async (post: FeedPost) => {
    const shareOptions = {
      title: 'PokeExplorer Discovery',
      message: `Check out this ${post.pokemonName} caught by ${post.trainerName}!`,
      url: post.pokemonImage, 
    };
    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.log('Share dismissed');
    }
  };

  // --- RENDER HELPERS ---
  const renderItem = ({ item }: { item: FeedPost }) => {
    const commentCount = item.comments ? Object.keys(item.comments).length : 0;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder} />
          <View>
            <Text style={styles.trainerName}>{item.trainerName}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Image Area */}
        <View style={styles.imageWrapper}>
            <Image source={{ uri: item.pokemonImage }} style={styles.cardImage} resizeMode="contain" />
        </View>

        {/* Action Bar */}
        <View style={styles.cardActions}>
          <View style={styles.leftActions}>
            {/* LIKE BUTTON */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
              <MaterialCommunityIcons name="heart-outline" size={24} color="#e63946" />
              <Text style={styles.actionText}>{item.likes || 0}</Text>
            </TouchableOpacity>
            
            {/* COMMENT BUTTON */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => openCommentModal(item)}>
              <MaterialCommunityIcons name="comment-text-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>{commentCount}</Text>
            </TouchableOpacity>

            {/* SHARE BUTTON */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)}>
              <MaterialCommunityIcons name="share-variant-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
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
  };

  // Find active post object for the comment modal
  const activePost = posts.find(p => p.id === activePostId);
  const commentsArray = activePost?.comments ? Object.values(activePost.comments) : [];

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

      {/* FAB (Add Post) */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      {/* --- CREATE POST MODAL --- */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Discovery</Text>

            <Text style={styles.label}>Select Pokémon:</Text>
            {myPokemonList.length === 0 ? (
              <Text style={styles.emptyText}>Go catch some Pokemon first!</Text>
            ) : (
              <FlatList
                data={myPokemonList}
                horizontal
                style={{ maxHeight: 100, marginBottom: 20 }}
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
                  </TouchableOpacity>
                )}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Say something about this catch..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => setCreateModalVisible(false)}
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

      {/* --- COMMENTS MODAL --- */}
      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, {height: '60%', justifyContent: 'space-between'}]}>
            <View>
                <Text style={styles.modalTitle}>Comments</Text>
                {commentsArray.length === 0 ? (
                    <Text style={styles.emptyText}>No comments yet.</Text>
                ) : (
                    <FlatList 
                        data={commentsArray}
                        keyExtractor={(item, index) => index.toString()}
                        style={{maxHeight: '80%'}}
                        renderItem={({item}) => (
                            <View style={styles.commentItem}>
                                <Text style={styles.commentUser}>{item.username}</Text>
                                <Text style={styles.commentText}>{item.text}</Text>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Input Area */}
            <View>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#999"
                    value={newComment}
                    onChangeText={setNewComment}
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity
                        style={[styles.btn, styles.cancelBtn]}
                        onPress={() => setCommentModalVisible(false)}
                    >
                        <Text style={styles.btnText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.postBtn]}
                        onPress={handleSendComment}
                    >
                        <Text style={styles.btnText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerTitle: {
    fontFamily: 'PokemonClassic',
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    fontFamily: 'PokemonClassic',
  },
  // --- CARD ---
  card: {
    backgroundColor: '#444',
    marginBottom: 20,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#555',
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#3d3d3d',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e63946',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  trainerName: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PokemonClassic',
    marginBottom: 4,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 10,
  },
  imageWrapper: {
    backgroundColor: '#555', // darker background for image to pop
    paddingVertical: 10,
  },
  cardImage: {
    width: '100%',
    height: 250,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingBottom: 15,
    paddingTop: 5,
  },
  postText: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontFamily: 'PokemonClassic',
    color: '#e63946', // Highlight pokemon name in red
    fontSize: 12,
  },
  
  // --- MODALS & INPUTS ---
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
    borderWidth: 2,
    borderColor: '#8B2323',
  },
  modalTitle: {
    fontFamily: 'PokemonClassic',
    fontSize: 14,
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    color: '#ccc',
    marginBottom: 10,
    fontSize: 12,
    fontFamily: 'PokemonClassic',
  },
  pokemonOption: {
    marginRight: 10,
    padding: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#333',
  },
  selectedOption: {
    borderColor: '#e63946',
    backgroundColor: '#555',
  },
  optionImage: {
    width: 60,
    height: 60,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  commentInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    height: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelBtn: {
    backgroundColor: '#444',
    borderColor: '#666',
  },
  postBtn: {
    backgroundColor: '#e63946',
    borderColor: '#8B0000',
  },
  btnText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PokemonClassic',
  },
  commentItem: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentUser: {
    color: '#e63946',
    fontSize: 10,
    fontFamily: 'PokemonClassic',
    marginBottom: 2,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
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
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default FeedScreen;