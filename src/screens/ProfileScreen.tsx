import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,   
  StatusBar, 
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker'; 
import { signOutUser } from '../api/authService';

// --- GRID MATH ---
const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 25; 
// We want 3 items per row. The available space is width - (padding * 2).
// Let's leave a small gap between items (approx 2% of screen).
const ITEM_WIDTH = (width - (CONTAINER_PADDING * 2) - 20) / 3; 

type UserProfile = {
  email: string;
  trainerName: string;
  profilePicture?: string; 
  createdAt: string;
  badges: string[];
  discoveredPokemon: { [key: string]: any };
};

type PokemonCapture = {
  id: number;
  name: string;
  imageUrl: string;
  capturedAt: string;
};

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentCaptures, setRecentCaptures] = useState<PokemonCapture[]>([]);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userRef = database().ref(`/users/${currentUser.uid}`);
    const onValueChange = userRef.on('value', snapshot => {
      const profileData = snapshot.val();
      
      if (profileData) {
        setUserProfile(profileData);

        if (profileData.discoveredPokemon) {
          const capturesArray: PokemonCapture[] = Object.values(profileData.discoveredPokemon);
          // Sort by newest
          capturesArray.sort((a, b) => {
            return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
          });
          setRecentCaptures(capturesArray);
        } else {
          setRecentCaptures([]);
        }
      }
      
      setLoading(false);
    });

    return () => userRef.off('value', onValueChange);
  }, [currentUser]);

  const handleSignOut = async () => {
    setMenuVisible(false);
    try {
      await signOutUser();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const openEditModal = () => {
    setMenuVisible(false);
    if (userProfile?.trainerName) {
      setNewName(userProfile.trainerName);
    }
    setEditModalVisible(true);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Trainer name cannot be empty');
      return;
    }
    if (!currentUser) return;

    try {
      await database().ref(`/users/${currentUser.uid}`).update({
        trainerName: newName.trim(),
      });
      setEditModalVisible(false);
      Alert.alert('Success', 'Trainer Card updated!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update name.');
    }
  };

  const handleUpdateProfilePicture = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.5, 
      includeBase64: true, 
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', 'Image picker error: ' + response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        const imageString = `data:${selectedImage.type};base64,${selectedImage.base64}`;
        
        if (currentUser) {
          try {
            await database().ref(`/users/${currentUser.uid}`).update({
              profilePicture: imageString,
            });
            Alert.alert('Success', 'Profile picture updated!');
          } catch (error) {
            Alert.alert('Error', 'Could not save image.');
          }
        }
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  const discoveredCount = recentCaptures.length;

  // --- NEW: CALCULATE RANK LOGIC ---
  // Rank starts at 1, and increases by 1 for every 5 Pokemon caught.
  const numericRank = Math.floor(discoveredCount / 5) + 1;
  // Format it to look like "001", "005", "012"
  const formattedRank = String(numericRank).padStart(3, '0');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- TRAINER CARD HEADER --- */}
        <View style={styles.headerBackground}>
          <View style={styles.headerCard}>
            
            {/* ... (Menu Icon & Profile Picture code remains same) ... */}
            <TouchableOpacity 
              style={styles.menuIcon} 
              onPress={() => setMenuVisible(true)}
            >
               <MaterialCommunityIcons name="dots-horizontal" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleUpdateProfilePicture}>
              {userProfile?.profilePicture ? (
                <Image 
                  source={{ uri: userProfile.profilePicture }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                   <MaterialCommunityIcons name="camera" size={30} color="#555" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.trainerName}>
              {userProfile?.trainerName || 'Trainer'}
            </Text>
            
            <Text style={styles.trainerEmail}>{currentUser?.email}</Text>

            <View style={styles.statsContainer}>
               <View style={styles.statBox}>
                  <Text style={styles.statValue}>{discoveredCount}</Text>
                  <Text style={styles.statLabel}>CAUGHT</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statBox}>
                  {/* UPDATED: Use the calculated formattedRank variable here */}
                  <Text style={styles.statValue}>{formattedRank}</Text>
                  <Text style={styles.statLabel}>RANK</Text>
               </View>
            </View>
          </View>
        </View>

        {/* ... (Rest of the file remains exactly the same) ... */}
        
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Recent Captures</Text>
          
          {recentCaptures.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Pokémon captured yet.</Text>
              <Text style={styles.emptySubText}>Go to Hunt Mode to find some!</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {/* SLICE(0, 9) ensures exactly 3x3 max */}
              {recentCaptures.slice(0, 9).map((pokemon) => (
                <View key={pokemon.capturedAt} style={styles.gridItem}>
                  <View style={styles.gridImageContainer}>
                    <Image source={{ uri: pokemon.imageUrl }} style={styles.gridImage} />
                  </View>
                  <Text style={styles.gridName} numberOfLines={1}>{pokemon.name}</Text>
                </View>
              ))}
              
              {/* Fillers to keep alignment if less than 3 in last row */}
              {[...Array(3 - (recentCaptures.slice(0,9).length % 3 || 3))].map((_, i) => (
                 <View key={`filler-${i}`} style={[styles.gridItem, {opacity: 0}]} />
              ))}
            </View>
          )}
        </View>

        {/* --- MODALS --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.menuOverlay} 
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={openEditModal}>
                <Text style={styles.menuText}>Edit name</Text>
              </TouchableOpacity>
              <View style={styles.menuSeparator} />
              <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                <Text style={styles.menuText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
           <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Trainer Name</Text>
              <TextInput 
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter new name"
                placeholderTextColor="#999"
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleUpdateName}
                >
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333333', 
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
  },
  headerBackground: {
    backgroundColor: '#8B2323',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: 30, 
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerCard: {
    width: '85%',
    alignItems: 'center',
    position: 'relative',
  },
  menuIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10, 
    padding: 5, 
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
  profilePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ccc', 
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff', 
  },
  trainerName: {
    fontFamily: 'PokemonClassic',
    fontSize: 16, 
    color: '#ffffff',
    marginBottom: 4,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  trainerEmail: {
    fontSize: 12, 
    color: '#ffdddd',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PokemonClassic',
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#ffdddd',
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  contentContainer: {
    paddingHorizontal: CONTAINER_PADDING,
  },
  sectionTitle: {
    fontFamily: 'PokemonClassic',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 15,
    marginLeft: 5,
  },
  // --- GRID STYLES ---
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
  },
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    alignItems: 'center',
  },
  gridImageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
    marginBottom: 8,
  },
  gridImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  gridName: {
    color: '#ccc',
    fontSize: 10,
    fontFamily: 'PokemonClassic',
    textAlign: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptySubText: {
    color: '#aaa',
    fontSize: 14,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 40 : 90,
    right: 30,
    backgroundColor: '#444', 
    borderRadius: 8,
    width: 140,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  menuText: {
    fontFamily: 'PokemonClassic',
    color: '#fff',
    fontSize: 10,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#666',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'PokemonClassic',
    fontSize: 12,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 25,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#999',
  },
  saveBtn: {
    backgroundColor: '#e63946',
  },
  btnText: {
    fontFamily: 'PokemonClassic',
    color: '#fff',
    fontSize: 10,
  },
});

export default ProfileScreen;