import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { MOCK_CAUGHT_POKEMON } from '../data/mockData';
import { PokemonDetail } from '../api/pokeApi';

// Get screen width to calculate card size dynamically
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3; // 48 = padding (16 left + 16 right + space between)

export default function PokedexScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState<'number' | 'name'>('number');
  const [isSortModalVisible, setSortModalVisible] = useState(false);

  // 1. FILTER Logic
  const filteredData = MOCK_CAUGHT_POKEMON.filter((pokemon) => {
    const searchLower = searchText.toLowerCase();
    const matchesName = pokemon.name.toLowerCase().includes(searchLower);
    const matchesId = pokemon.id.toString().includes(searchLower);
    return matchesName || matchesId;
  });

  // 2. SORT Logic
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    }
    return a.id - b.id; // Default: Sort by Number
  });

  // 3. RENDER ITEM (The Card)
  const renderCard = ({ item }: { item: PokemonDetail }) => {
    // Format ID to #001
    const formattedId = `#${item.id.toString().padStart(3, '0')}`;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PokemonDetail', { pokemonId: item.id })}
      >
        <View style={styles.cardInner}>
            <Text style={styles.idText}>{formattedId}</Text>
            <Image source={{ uri: item.spriteUrl }} style={styles.sprite} />
        </View>
        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerTitle}>Pokédex</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              {/* You can add an Icon here if you have vector-icons installed */}
              <Text style={{fontSize: 16, marginRight: 8}}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                 <TouchableOpacity onPress={() => setSearchText('')}>
                   <Text style={{fontSize: 16, color: '#666'}}>✕</Text>
                 </TouchableOpacity>
              )}
            </View>
            
            {/* Sort Button */}
            <TouchableOpacity 
              style={styles.sortButton} 
              onPress={() => setSortModalVisible(true)}
            >
              <Text style={styles.sortButtonText}>#</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* GRID CONTENT */}
      <FlatList
        data={sortedData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      {/* SORT MODAL */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort by:</Text>
            
            <TouchableOpacity 
              style={styles.radioRow} 
              onPress={() => { setSortOption('number'); setSortModalVisible(false); }}
            >
              <View style={[styles.radioOuter, sortOption === 'number' && styles.radioSelected]}>
                {sortOption === 'number' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Number</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.radioRow} 
              onPress={() => { setSortOption('name'); setSortModalVisible(false); }}
            >
               <View style={[styles.radioOuter, sortOption === 'name' && styles.radioSelected]}>
                {sortOption === 'name' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Name</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // --- HEADER STYLES ---
  header: {
    backgroundColor: '#DC0A2D', // Official Pokedex Red
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10, 
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#000',
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC0A2D',
  },
  
  // --- LIST STYLES ---
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  // --- CARD STYLES ---
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    // No background color here to keep it clean, or subtle white
  },
  cardInner: {
    width: '100%',
    aspectRatio: 1, // Make it square
    backgroundColor: '#F7F7F7', // Light gray background for image area
    borderRadius: 12,
    padding: 8,
    position: 'relative',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  idText: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 10,
    color: '#666',
  },
  sprite: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  nameText: {
    fontSize: 12,
    color: '#333',
    textTransform: 'capitalize',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white', // The design had a red header for modal? Or just red text. 
    // Adapting for simple white box:
    // color: '#DC0A2D',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DC0A2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#DC0A2D',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC0A2D',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  }
});

// export default PokedexScreen;