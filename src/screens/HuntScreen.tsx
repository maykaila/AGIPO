// src/screens/HuntScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HuntScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Hunt Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HuntScreen;