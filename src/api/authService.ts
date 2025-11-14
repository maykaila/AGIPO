import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Call this once when your app starts (e.g., in App.tsx)
 */
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Get this from your google-services.json file
    // (it's the 'client_id' of type 3 inside 'client' array)
    webClientId: '961251609144-jsvvnr8d5etnihn1g3ng2lclra47m3nh.apps.googleusercontent.com',
  });
};

/**
 * Creates a new user with Email/Password and sets up their profile in the database.
 [cite_start]* [cite: 21-25]
 */
export const signUpWithEmail = async (email: string, pass: string) => {
  if (!email || !pass) {
    // Let the UI handle this
    throw new Error('Please enter both email and password.');
  }
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, pass);
    const uid = userCredential.user.uid;

    // Create user profile in Realtime Database
    const newUserRef = database().ref(`/users/${uid}`);
    await newUserRef.set({
      email: userCredential.user.email,
      createdAt: new Date().toISOString(),
      discoveredPokemon: {}, // Empty pokedex
      badges: [],
      trainerName: userCredential.user.email?.split('@')[0] || 'Trainer',
    });

    return userCredential;
  } catch (error: any) {
    console.error("Sign up error:", error.code);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('That email address is already in use!');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('That email address is invalid!');
    } else {
      throw new Error('Sign up failed. Please try again.');
    }
  }
};

/**
 * Signs in a user with Email/Password.
 */
export const signInWithEmail = async (email: string, pass: string) => {
  if (!email || !pass) {
    throw new Error('Please enter both email and password.');
  }
  try {
    return await auth().signInWithEmailAndPassword(email, pass);
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw new Error('Failed to sign in. Please check your email and password.');
  }
};

/**
 * Handles Google Sign-In and creates a user profile if one doesn't exist.
 */
export const signInWithGoogle = async () => {
  try {
    // Check if your device has Google Play Services installed
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // 1. Sign in to get the user authenticated
    await GoogleSignin.signIn(); 
    
    // 2. Get the tokens (this is the reliable part)
    const { idToken } = await GoogleSignin.getTokens();

    // Ensure idToken is present
    if (!idToken) {
        throw new Error('Google Sign-In failed to get ID token.');
    }

    // 3. Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // 4. Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    // Check if user is new and create profile in database
    if (userCredential.additionalUserInfo?.isNewUser) {
      const uid = userCredential.user.uid;
      const newUserRef = database().ref(`/users/${uid}`);
      await newUserRef.set({
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        discoveredPokemon: {},
        badges: [],
        trainerName: userCredential.user.displayName || 'Trainer',
      });
      console.log('New Google user profile created in RTDB');
    }
    return userCredential;

  } catch (error: any) {
    console.error("Google sign in error:", error);
    throw new Error('Google Sign-In failed. Please try again.');
  }
};


/**
 * Signs out the user from all services.
 */
export const signOutUser = async () => {
  try {
    await auth().signOut();
    
    // --- THIS IS THE FIX ---
    // Check if a user is currently signed in to Google
    const currentUser = await GoogleSignin.getCurrentUser();
    if (currentUser) {
      // If so, sign them out
      await GoogleSignin.signOut();
    }
    // -----------------------

  } catch (error) {
    console.error('Sign out error:', error);
  }
};