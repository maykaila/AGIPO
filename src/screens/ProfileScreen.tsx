import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { signOutUser } from '../api/authService';

// This type defines the structure of your user data in the Realtime Database
type UserProfile = {
  email: string;
  trainerName: string;
  createdAt: string;
  badges: string[];
  discoveredPokemon: { [key: string]: any }; // Object to hold discovered Pokemon
};

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const currentUser = auth().currentUser; // Get the currently authenticated user

  useEffect(() => {
    if (!currentUser) {
      // This should technically not happen if RootNavigator is working
      setLoading(false);
      return;
    }

    // Set up a listener to the user's profile in the Realtime Database
    const userRef = database().ref(`/users/${currentUser.uid}`);

    const onValueChange = userRef.on('value', snapshot => {
      const profileData = snapshot.val();
      setUserProfile(profileData);
      setLoading(false);
    });

    // Stop listening for updates when the component unmounts
    return () => userRef.off('value', onValueChange);
  }, [currentUser]); // Re-run if the user changes

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // RootNavigator will automatically handle the screen change
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  // Get a count of discovered Pokemon
  const discoveredCount = userProfile?.discoveredPokemon
    ? Object.keys(userProfile.discoveredPokemon).length
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Trainer Name</Text>
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

        {/* This is where you would map out badges or the photo gallery */}
        <Text style={styles.todo}>[Captures Gallery grid here]</Text>
        <Text style={styles.todo}>[Badges list here]</Text>


        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 18,
    color: '#333',
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
    marginTop: 'auto', // Pushes the button to the bottom
    backgroundColor: '#e63946', // Pokemon Red
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;