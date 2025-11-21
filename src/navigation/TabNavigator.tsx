import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Import the Icon library
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import PokedexScreen from '../screens/PokedexScreen';
import HuntScreen from '../screens/HuntScreen';
import ARScreen from '../screens/ARScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // 1. Dark Theme Background
        tabBarStyle: {
          backgroundColor: '#373737',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        // 2. Color Logic
        tabBarActiveTintColor: '#e63946', // Pokemon Red
        tabBarInactiveTintColor: '#888888', // Grey

        // 3. Icon Logic
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-circle'; // Default fallback

          if (route.name === 'Hunt') {
            // A map marker searching (perfect for hunting)
            iconName = focused ? 'map-marker-radius' : 'map-marker-radius-outline';
          } else if (route.name === 'Pokedex') {
            // The actual Pokeball icon!
            iconName = 'pokeball'; 
          } else if (route.name === 'AR') {
            // A camera lens
            iconName = focused ? 'camera-iris' : 'camera';
          } else if (route.name === 'Feed') {
            // A newspaper/timeline icon
            iconName = focused ? 'newspaper-variant' : 'newspaper-variant-outline';
          } else if (route.name === 'Profile') {
            // A trainer card/account icon
            iconName = focused ? 'card-account-details' : 'card-account-details-outline';
          }

          // Return the icon component
          return <MaterialCommunityIcons name={iconName} size={30} color={color} />;
        },
        // Remove the labels if you want a cleaner look (optional)
        tabBarShowLabel: true, 
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
        }
      })}
    >
      <Tab.Screen name="Hunt" component={HuntScreen} />
      <Tab.Screen name="Pokedex" component={PokedexScreen} />
      <Tab.Screen name="AR" component={ARScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};