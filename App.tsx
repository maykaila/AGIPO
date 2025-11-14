/**
 * Your main App.tsx file.
 * Its only job is to configure Google Sign-In and render the RootNavigator.
 */
import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { configureGoogleSignIn } from './src/api/authService';

// Configure Google Sign-In on app launch
configureGoogleSignIn();

/**
 * The main App component.
 */
const App = () => {
  return <RootNavigator />;
};

export default App;