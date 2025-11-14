import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  signInWithEmail,
  signInWithGoogle,
} from '../api/authService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// We get the navigation prop from the RootNavigator
type LoginScreenProps = NativeStackScreenProps<any, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleError = (error: any) => {
    setLoading(false);
    console.error(error);
    Alert.alert('Authentication Error', error.message);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      handleError(error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      handleError(error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          style={styles.logo}
          source={{ uri: 'https://placehold.co/150x150/png?text=PokeBall' }}
          resizeMode="contain"
        />
        <Text style={styles.title}>PokeExplorer</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading} // Disable button when loading
        >
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* THIS IS YOUR GOOGLE SIGNUP/LOGIN BUTTON */}
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading}>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* This is the new navigation link */}
        <TouchableOpacity
          style={styles.navLinkButton}
          onPress={() => navigation.navigate('SignUp')} // Navigate to the new screen
        >
          <Text style={styles.navLinkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// Re-using the same styles, but adding navLink
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#e63946', // Pokemon Red
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  googleButton: {
    backgroundColor: '#db4437', // Google Red
  },
  navLinkButton: {
    marginTop: 20,
  },
  navLinkText: {
    fontSize: 16,
    color: '#457b9d',
    fontWeight: '600',
  },
});

export default LoginScreen;