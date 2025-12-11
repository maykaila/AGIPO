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
import { signUpWithEmail } from '../api/authService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PokeballLogo from '../images/pokeball.svg'; 
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type SignUpScreenProps = NativeStackScreenProps<any, 'SignUp'>;

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleError = (error: any) => {
    setLoading(false);
    console.error(error);
    Alert.alert('Sign Up Error', error.message);
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match!');
        return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
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
            <Text style={styles.title}>Join the Adventure</Text>
            <Text style={styles.subtitle}>Create your trainer account</Text>
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
        
        <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-check-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
            />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'CREATING...' : 'SIGN UP'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Log In</Text>
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
    borderRadius: 8,
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
  },
  button: {
    width: '100%',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
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

export default SignUpScreen;