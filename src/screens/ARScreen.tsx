import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera"; 
import { capturePokemon, PokemonData } from "../api/pokemonService";
import { fetchPokemonList } from "../api/pokeAPI";

const typeColors: Record<string, string> = {
  grass: '#74CB48',
  fire: '#F57D31',
  water: '#6493EB',
  bug: '#A7B723',
  normal: '#AAA67F',
  electric: '#F9CF30',
  ghost: '#70559B',
  psychic: '#FB5584',
  steel: '#B7B9D0',
  rock: '#B69E31',
  poison: '#A43E9E',
  ground: '#E2BF65',
  dragon: '#7037FF',
  fairy: '#D685AD',
  ice: '#9AD6DF',
  fighting: '#C12239'
};

type SpawnedPokemon = PokemonData & {
  spawnedAt: number;
  isCaught?: boolean;
};

const ARScreen = ({ navigation, route }: any) => {
  const { pokemon: targetPokemon } = route.params || {};

  const device = useCameraDevice('back');
  
  const camera = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [spawnedPokemon, setSpawnedPokemon] = useState<SpawnedPokemon | null>(null);
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [caughtPokemonIds, setCaughtPokemonIds] = useState<Set<number>>(new Set());

  // State to track if pokemon ran away
  const [hasFled, setHasFled] = useState(false);

  // Timer ref
  const fleeTimeout = useRef<any>(null);

  // Helper to start the 10s countdown
  const startFleeTimer = () => {
    if (fleeTimeout.current) clearTimeout(fleeTimeout.current);

    fleeTimeout.current = setTimeout(() => {
      setSpawnedPokemon(null);
      setHasFled(true); 
    }, 10000); 
  };

  useEffect(() => {
    (async () => {
      try {
        if (targetPokemon) {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${targetPokemon.id}`);
          const details = await res.json();
          
          const detailedPokemon: PokemonData = {
            id: details.id,
            name: details.name,
            imageUrl: details.sprites.other['official-artwork'].front_default,
            types: details.types.map((t: any) => t.type.name), 
            height: details.height,
            weight: details.weight
          };

          spawnSpecificPokemon(detailedPokemon);
          setIsLoading(false);
          loadBackgroundList(); 
        } 
        else {
          await loadBackgroundList();
          setIsLoading(false);
        }

      } catch (e) {
        console.error("Failed to load pokemon data", e);
        setIsLoading(false);
        Alert.alert("Error", "Could not load Pokémon data");
      }
    })();
    
    return () => {
        if (fleeTimeout.current) clearTimeout(fleeTimeout.current);
    };
  }, [targetPokemon]);

  const loadBackgroundList = async () => {
    const pokeList = await fetchPokemonList();
    const pokemonDataList: PokemonData[] = pokeList.map((pokemon: any) => ({
      ...pokemon,
      types: pokemon.types || ["normal"], 
      imageUrl:
        pokemon.imageUrl ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
    }));
    setAllPokemon(pokemonDataList);
    
    if (!targetPokemon) {
       spawnRandomPokemon(pokemonDataList);
    }
  };

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  function spawnSpecificPokemon(p: PokemonData) {
    const isCaught = caughtPokemonIds.has(p.id);
    setHasFled(false); 
    setSpawnedPokemon({ ...p, spawnedAt: Date.now(), isCaught });
    
    if (!isCaught) startFleeTimer();
  }

  function spawnRandomPokemon(pokemonList: PokemonData[]) {
    if (pokemonList.length === 0) return;
    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const isCaught = caughtPokemonIds.has(randomPokemon.id);
    
    setHasFled(false);
    setSpawnedPokemon({ ...randomPokemon, spawnedAt: Date.now(), isCaught });
    
    if (!isCaught) startFleeTimer();
  }

  async function captureCurrentPokemon() {
    if (fleeTimeout.current) clearTimeout(fleeTimeout.current);

    if (!spawnedPokemon) return;
    
    try {
      if (camera.current) {
        await camera.current.takePhoto({ flash: "off" });
      }
      const success = await capturePokemon({
        id: spawnedPokemon.id,
        name: spawnedPokemon.name,
        imageUrl: spawnedPokemon.imageUrl,
        types: spawnedPokemon.types,
        height: spawnedPokemon.height,
        weight: spawnedPokemon.weight,
      });

      if (success) {
        Alert.alert("Success! 🎉", `You caught ${spawnedPokemon.name}!`);
        const newCaughtIds = new Set(caughtPokemonIds);
        newCaughtIds.add(spawnedPokemon.id);
        setCaughtPokemonIds(newCaughtIds);
        
        setSpawnedPokemon(prev => prev ? { ...prev, isCaught: true } : null);
      }
    } catch (err) {
      console.error("Capture error:", err);
      Alert.alert("Error", "Failed to capture Pokémon. Try again!");
      startFleeTimer(); 
    }
  }

  if (hasPermission === null || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={{ marginTop: 12, color: "#fff" }}>Loading AR...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          Camera permission required.
        </Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
         <Text style={{ color: "#fff", textAlign: 'center' }}>
            Camera device not found.
         </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        ref={camera}
      />

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Retreat</Text>
      </TouchableOpacity>

      {spawnedPokemon && !hasFled && (
        <View style={styles.pokemonContainer}>
          {spawnedPokemon.isCaught && (
            <View style={styles.caughtBadge}>
              <Text style={styles.caughtBadgeText}>✓ CAUGHT</Text>
            </View>
          )}
          
          <View style={[styles.spriteBox, spawnedPokemon.isCaught && styles.spriteBoxCaught]}>
            <Image
              source={{ uri: spawnedPokemon.imageUrl }}
              style={styles.sprite}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.pokemonName}>{spawnedPokemon.name.toUpperCase()}</Text>

          <View style={styles.typesRow}>
            {spawnedPokemon.types?.map((type, index) => (
              <View 
                key={index} 
                style={[
                  styles.typeBadge, 
                  { backgroundColor: typeColors[type.toLowerCase()] || '#777' }
                ]}
              >
                <Text style={styles.typeText}>{type.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* UI: Handle "Ran Away" state */}
      {!spawnedPokemon && (
        <View style={styles.loadingIndicator}>
          {hasFled ? (
             <View style={{ alignItems: 'center' }}>
                <Text style={{ color: "#FF6B6B", fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                  It ran away! 💨
                </Text>
                
                {/* 1. FIXED: Button now goes BACK instead of random spawn */}
                <TouchableOpacity 
                   style={styles.retryBtn} 
                   onPress={() => navigation.goBack()}
                >
                   <Text style={{ color: 'white', fontWeight: 'bold' }}>SEARCH AGAIN ↻</Text>
                </TouchableOpacity>

             </View>
          ) : (
             <Text style={{ color: "#fff", fontSize: 16 }}>Scanning Area...</Text>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.captureBtn,
            (!spawnedPokemon || hasFled) && styles.captureDisabled,
            spawnedPokemon?.isCaught && styles.captureCaught,
          ]}
          onPress={() => captureCurrentPokemon()}
          disabled={!spawnedPokemon || hasFled || spawnedPokemon?.isCaught}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {hasFled ? "MISSED!" : !spawnedPokemon ? "WAITING..." : spawnedPokemon.isCaught ? "ALREADY CAUGHT" : "CAPTURE"}
          </Text>
        </TouchableOpacity>

        {spawnedPokemon && !hasFled && (
            <TouchableOpacity 
                style={styles.detailsBtn}
                onPress={() => navigation.navigate("PokemonDetailScreen", { pokemonId: spawnedPokemon.id })}
            >
                <Text style={styles.detailsBtnText}>🔍 VIEW DETAILS</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8
  },
  backButtonText: { color: 'white', fontWeight: 'bold' },
  pokemonContainer: { position: "absolute", top: "20%", left: 0, right: 0, alignItems: "center", zIndex: 10 },
  sprite: { width: 240, height: 240, resizeMode: "contain" },
  spriteBox: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: "#ffd700",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  spriteBoxCaught: { borderColor: "#4caf50", backgroundColor: "rgba(76, 175, 80, 0.1)" },
  caughtBadge: {
    position: "absolute", top: -10, backgroundColor: "#4caf50",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 20,
  },
  caughtBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  pokemonName: {
    color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 8,
    textShadowColor: "#000", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4,
  },
  
  typesRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, 
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 60,
    alignItems: 'center',
  },
  typeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  loadingIndicator: { position: "absolute", top: "45%", left: 0, right: 0, alignItems: "center", zIndex: 10 },
  
  retryBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 10
  },

  controls: { position: "absolute", bottom: 30, left: 0, right: 0, justifyContent: "center", alignItems: "center" },
  
  captureBtn: {
    width: 160, height: 56, borderRadius: 28, backgroundColor: "#ef5350",
    alignItems: "center", justifyContent: "center", marginBottom: 12, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 8,
  },
  captureDisabled: { backgroundColor: "#757575", opacity: 0.6 },
  captureCaught: { backgroundColor: "#4caf50", opacity: 0.8 },

  detailsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  detailsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  }
});

export default ARScreen;