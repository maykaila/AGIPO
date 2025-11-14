// src/navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PokedexScreen from '../screens/PokedexScreen';
import HuntScreen from '../screens/HuntScreen';
import ARScreen from '../screens/ARScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        // Customize tab bar appearance (simple colors, Pokémon theme [cite: 61])
        headerShown: false,
      }}>
      <Tab.Screen name="Hunt" component={HuntScreen} />
      <Tab.Screen name="Pokedex" component={PokedexScreen} />
      <Tab.Screen name="AR" component={ARScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};