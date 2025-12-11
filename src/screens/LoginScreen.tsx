import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import PokeballLogo from '../images/pokeball.svg'; 
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { signInWithEmail, signInWithGoogle } from '../api/authService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type LoginScreenProps = NativeStackScreenProps<any, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <StatusBar barStyle="light-content" backgroundColor="#373737" />
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.logoContainer}>
            <PokeballLogo width={100} height={100} />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            />
        </View>

        <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#666" 
                />
            </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'LOGGING IN...' : 'LOG IN'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading}>
          <MaterialCommunityIcons name="google" size={20} color="#fff" style={{marginRight: 10}} />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#373737',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 20,
    color: '#fff',
    marginTop: 15,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 10,
    color: '#ccc',
    marginTop: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8, // Square corners look more retro
    borderWidth: 2,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    // Keep default font for inputs so they are readable
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 55,
    borderRadius: 8, // Retro corners
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#e63946', 
    borderWidth: 3,
    borderColor: '#8B0000',
    elevation: 3,
  },
  buttonText: {
    fontFamily: 'PokemonClassic', // RETRO
    color: '#fff',
    fontSize: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#555',
  },
  orText: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 10,
    color: '#888',
    paddingHorizontal: 10,
  },
  googleButton: {
    backgroundColor: '#DB4437', 
    borderColor: '#8B0000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    // Keep default font for small readable text
    color: '#ccc',
    fontSize: 14,
  },
  linkText: {
    fontFamily: 'PokemonClassic', // RETRO
    color: '#fff',
    fontSize: 10,
    marginLeft: 5,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
});

export default LoginScreen;