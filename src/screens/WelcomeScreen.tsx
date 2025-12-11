import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PokeballLogo from '../images/pokeball.svg'; 

type WelcomeScreenProps = NativeStackScreenProps<any, 'Welcome'>;

const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#373737" />
      
      <View style={styles.container}>
        
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
            <View style={styles.logoWrapper}>
                <PokeballLogo width={180} height={180} />
            </View>
            <Text style={styles.title}>PokeExplorer</Text>
            <Text style={styles.subtitle}>
                Gotta Catch 'Em All!
            </Text>
        </View>

        {/* BUTTON SECTION */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.primaryButtonText}>START GAME</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.secondaryButtonText}>CONTINUE</Text>
            </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#373737',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between', 
    paddingHorizontal: 24,
    paddingBottom: 50, 
    paddingTop: 80,    
  },
  heroContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'PokemonClassic', // RETRO FONT
    fontSize: 24,
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 2, 
  },
  subtitle: {
    fontFamily: 'PokemonClassic', // RETRO FONT
    fontSize: 10,
    color: '#ccc',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 15, 
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, 
  },
  primaryButton: {
    backgroundColor: '#e63946', 
    borderColor: '#8B0000', 
    elevation: 5,
  },
  primaryButtonText: {
    fontFamily: 'PokemonClassic', // RETRO FONT
    color: '#fff',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#999',
  },
  secondaryButtonText: {
    fontFamily: 'PokemonClassic', // RETRO FONT
    color: '#333',
    fontSize: 12,
  },
});

export default WelcomeScreen;