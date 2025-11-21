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
import { signUpWithEmail } from '../api/authService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PokeballLogo from '../images/pokeball.svg'; 

// We get the navigation prop from the RootNavigator
type SignUpScreenProps = NativeStackScreenProps<any, 'SignUp'>;

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleError = (error: any) => {
    setLoading(false);
    console.error(error);
    Alert.alert('Sign Up Error', error.message);
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      // On success, the RootNavigator will automatically handle the screen change
    } catch (error: any) {
      handleError(error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <PokeballLogo width={150} height={150} style={styles.logo} />
        <Text style={styles.title}>Create Account</Text>

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
          style={[styles.button, styles.signUpButton]}
          onPress={handleSignUp}
          disabled={loading}>
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navLinkButton}
          onPress={() => navigation.goBack()} // Go back to the Login screen
        >
          <Text style={styles.navLinkText}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// We can reuse the same styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#373737ff',
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
    color: '#ffffffff',
    marginBottom: 30,
  },
  input: {
    width: '90%',
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
    width: '90%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#e63946', // Water Blue
  },
  navLinkButton: {
    marginTop: 20,
  },
  navLinkText: {
    fontSize: 16,
    color: '#c8c8c8ff',
    fontWeight: '600',
  },
});

export default SignUpScreen;