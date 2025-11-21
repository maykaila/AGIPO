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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { signOutUser } from '../api/authService';

type UserProfile = {
  email: string;
  trainerName: string;
  createdAt: string;
  badges: string[];
  discoveredPokemon: { [key: string]: any };
};

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // NEW: State for handling the Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

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

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  // NEW: Function to open modal and pre-fill current name
  const openEditModal = () => {
    if (userProfile?.trainerName) {
      setNewName(userProfile.trainerName);
    }
    setModalVisible(true);
  };

  // NEW: Function to update Firebase
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
      setModalVisible(false);
      Alert.alert('Success', 'Trainer Card updated!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update name.');
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Trainer Name</Text>
            {/* NEW: Edit Button */}
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.infoValue}>
            {userProfile?.trainerName || 'Trainer'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{currentUser?.email}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Pokémon Discovered</Text>
          <Text style={styles.infoValue}>{discoveredCount}</Text>
        </View>

        <Text style={styles.todo}>[Captures Gallery grid here]</Text>
        <Text style={styles.todo}>[Badges list here]</Text>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* NEW: Edit Name Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
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
                  onPress={() => setModalVisible(false)}
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

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#373737ff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#888',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  // NEW STYLES
  editLink: {
    color: '#81b0ff', // A nice link blue/purple
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoValue: {
    fontSize: 18,
    color: '#ffffffff',
    fontWeight: '600',
    marginTop: 4,
  },
  todo: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 10,
  },
  signOutButton: {
    marginTop: 'auto', 
    backgroundColor: '#e63946', 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    padding: 10,
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
  },
});

export default ProfileScreen;