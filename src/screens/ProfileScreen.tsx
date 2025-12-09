import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,   // <--- 1. Import Platform
  StatusBar,  // <--- 2. Import StatusBar
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker'; 
import { signOutUser } from '../api/authService';

type UserProfile = {
  email: string;
  trainerName: string;
  profilePicture?: string; 
  createdAt: string;
  badges: string[];
  discoveredPokemon: { [key: string]: any };
};

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
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
      setUserProfile(profileData);
      setLoading(false);
    });

    return () => userRef.off('value', onValueChange);
  }, [currentUser]);

  // --- ACTIONS ---

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
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
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
            console.error(error);
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

  const discoveredCount = userProfile?.discoveredPokemon
    ? Object.keys(userProfile.discoveredPokemon).length
    : 0;
  
  const badgePlaceholders = Array(8).fill(0);

  return (
    // 3. Changed SafeAreaView to normal View so background color bleeds to top
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- HEADER SECTION --- */}
        <View style={styles.headerContainer}>
          
          <TouchableOpacity 
            style={styles.menuIcon} 
            onPress={() => setMenuVisible(true)}
          >
             <MaterialCommunityIcons name="dots-horizontal" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Profile Picture Circle */}
          <TouchableOpacity onPress={handleUpdateProfilePicture}>
            {userProfile?.profilePicture ? (
              <Image 
                source={{ uri: userProfile.profilePicture }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                 <MaterialCommunityIcons name="camera" size={40} color="#999" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.trainerName}>
            {userProfile?.trainerName || 'Trainer'}
          </Text>
          
          <Text style={styles.trainerEmail}>{currentUser?.email}</Text>
        </View>

        {/* --- CONTENT SECTION --- */}
        <View style={styles.contentContainer}>
          
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Pokemon Discovered</Text>
            <Text style={styles.statsValue}>{discoveredCount}</Text>
          </View>
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {badgePlaceholders.map((_, index) => (
              <View key={index} style={styles.badgePlaceholder} />
            ))}
          </View>

        </View>

        {/* --- 1. POPUP MENU MODAL --- */}
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


        {/* --- 2. EDIT NAME INPUT MODAL --- */}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
  },
  headerContainer: {
    backgroundColor: '#8B2323',
    // --- 4. RESPONSIVE HEADER FIX ---
    // Push content down based on StatusBar height
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 40, 
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    position: 'relative',
  },
  menuIcon: {
    position: 'absolute',
    // Adjust top position to account for the new padding
    top: 20,//Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    right: 20,
    zIndex: 10, 
    padding: 5, 
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#C4C4C4', 
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff', 
  },
  trainerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  trainerEmail: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  contentContainer: {
    padding: 25,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#555555',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgePlaceholder: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#C4C4C4',
    borderRadius: 12,
    marginBottom: 15,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    // Push the menu down so it appears below the dots
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 70,
    right: 20,
    backgroundColor: '#444', 
    borderRadius: 8,
    width: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#666',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 22,
    fontWeight: 'bold',
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;