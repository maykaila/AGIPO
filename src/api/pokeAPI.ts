// src/api/pokeApi.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_LIST_CACHE_KEY = 'pokemon_list_cache';
const POKEMON_DETAIL_CACHE_PREFIX = 'pokemon_detail_';
const INITIAL_POKEMON_LIMIT = 151; // Gen 1, as per requirement [cite: 67]

// Define a type for the basic list item
export type PokemonListItem = {
  name: string;
  url: string;
};

// Define a type for the detailed Pokémon data
export type PokemonDetail = {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  stats: any[]; // You can type this more strictly if needed
  spriteUrl: string;
  speciesData: any; // Contains evolution chain link and flavor text
  weight: number;
  height: number;
};

/**
 * Fetches a list of Pokémon with basic information (name and URL).
 * Implements caching using AsyncStorage for offline support. [cite: 30]
 */
export async function fetchPokemonList(): Promise<PokemonListItem[]> {
  // 1. Check cache first
  try {
    const cachedList = await AsyncStorage.getItem(POKEMON_LIST_CACHE_KEY);
    if (cachedList) {
      console.log('Returning list from cache.');
      return JSON.parse(cachedList);
    }
  } catch (e) {
    console.warn('Could not read cache:', e);
  }

  // 2. If not cached, fetch from API
  try {
    const response = await fetch(
      `${POKEAPI_BASE_URL}/pokemon?limit=${INITIAL_POKEMON_LIMIT}&offset=0`,
    );
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const results: PokemonListItem[] = data.results;

    // 3. Cache the new data
    await AsyncStorage.setItem(
      POKEMON_LIST_CACHE_KEY,
      JSON.stringify(results),
    );
    console.log('Fetched and cached new list.');
    return results;
  } catch (error) {
    console.error('Error fetching Pokémon list:', error);
    return [];
  }
}

/**
 * Fetches detailed information for a specific Pokémon by ID or name.
 * Implements caching for individual Pokémon details.
 */
export async function fetchPokemonDetail(
  idOrName: string | number,
): Promise<PokemonDetail | null> {
  const cacheKey = `${POKEMON_DETAIL_CACHE_PREFIX}${idOrName}`;

  // 1. Check cache for this specific Pokémon
  try {
    const cachedDetail = await AsyncStorage.getItem(cacheKey);
    if (cachedDetail) {
      console.log(`Returning detail for ${idOrName} from cache.`);
      return JSON.parse(cachedDetail);
    }
  } catch (e) {
    console.warn('Could not read detail cache:', e);
  }

  // 2. If not cached, fetch from API
  try {
    console.log(`Fetching detail for ${idOrName} from API...`);
    const detailResponse = await fetch(
      `${POKEAPI_BASE_URL}/pokemon/${idOrName}`,
    );
    if (!detailResponse.ok) throw new Error('Failed to fetch Pokémon details');
    const detailData = await detailResponse.json();

    // Fetch species data for flavor text and evolution chain
    const speciesResponse = await fetch(detailData.species.url);
    if (!speciesResponse.ok) throw new Error('Failed to fetch species data');
    const speciesData = await speciesResponse.json();

    // Combine essential data points
    const pokemonDetail: PokemonDetail = {
      id: detailData.id,
      name: detailData.name,
      types: detailData.types.map((t: any) => t.type.name),
      abilities: detailData.abilities.map((a: any) => a.ability.name),
      stats: detailData.stats,
      spriteUrl: detailData.sprites.front_default, // Default sprite [cite: 27]
      // You can also grab the animated GIF:
      // spriteUrl: detailData.sprites.versions['generation-v']['black-white'].animated.front_default,
      speciesData: speciesData, // Contains evolution_chain.url and flavor_text_entries
      weight: detailData.weight,
      height: detailData.height,
    };

    // 3. Cache the new detail data
    await AsyncStorage.setItem(cacheKey, JSON.stringify(pokemonDetail));
    return pokemonDetail;
  } catch (error) {
    console.error(`Error fetching Pokémon detail for ${idOrName}:`, error);
    return null;
  }
}

// You can add more functions here, e.g., for fetching by type
// export async function fetchPokemonByType(type: string) { ... }