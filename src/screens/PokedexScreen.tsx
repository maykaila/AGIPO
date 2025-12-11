import React, { useState, useEffect } from 'react';
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
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { fetchPokemonList, PokemonDetail } from '../api/pokeAPI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3; 

export default function PokedexScreen({ navigation }: any) {
  const [pokemonList, setPokemonList] = useState<PokemonDetail[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState<'number' | 'name'>('number');
  const [isSortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchPokemonList();
      setPokemonList(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredData = pokemonList.filter((pokemon) => {
    const searchLower = searchText.toLowerCase();
    const matchesName = pokemon.name.toLowerCase().includes(searchLower);
    const matchesId = pokemon.id.toString().includes(searchLower);
    return matchesName || matchesId;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    }
    return a.id - b.id;
  });

  const renderCard = ({ item }: { item: PokemonDetail }) => {
    const formattedId = `#${item.id.toString().padStart(3, '0')}`;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PokemonDetailScreen', { pokemonId: item.id })}
      >
        <View style={styles.cardInner}>
            <Text style={styles.idText}>{formattedId}</Text>
            <Image source={{ uri: item.spriteUrl }} style={styles.sprite} />
        </View>
        {/* Using Retro Font for Name */}
        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8B2323" />
        <Text style={{color: 'white', marginTop: 10}}>Loading Pokedex...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Pokédex</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
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
            
            <TouchableOpacity 
              style={styles.sortButton} 
              onPress={() => setSortModalVisible(true)}
            >
              <Text style={styles.sortButtonText}>#</Text>
            </TouchableOpacity>
          </View>
      </View>

      <FlatList
        data={sortedData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: '#333333', 
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#8B2323', 
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 5, 
  },
  headerTitle: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 20,
    color: 'white',
    marginBottom: 16,
    marginLeft: 4,
    marginTop: 10,
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
    color: '#8B2323',
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  cardInner: {
    width: '100%',
    aspectRatio: 1, 
    backgroundColor: '#333333', 
    borderRadius: 12,
    padding: 8,
    position: 'relative',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  idText: {
    fontFamily: 'PokemonClassic', // RETRO
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 8,
    color: '#fff',
  },
  sprite: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  nameText: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 8, // Smaller font for retro look
    color: '#fff',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 200,
    backgroundColor: '#3d3d3dff', 
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 12,
    marginBottom: 16,
    color: 'white',
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
    borderColor: '#8B2323',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#8B2323',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B2323',
  },
  radioLabel: {
    fontFamily: 'PokemonClassic', // RETRO
    fontSize: 10,
    color: '#fff',
  }
});