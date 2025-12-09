// src/screens/ARScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Camera, useCameraDevices } from "react-native-vision-camera";
import database from "@react-native-firebase/database";
import auth from "@react-native-firebase/auth";
import { capturePokemon, PokemonData } from "../api/pokemonService";
import { fetchPokemonList } from "../api/pokeAPI";

type SpawnedPokemon = PokemonData & {
  spawnedAt: number;
    isCaught?: boolean;
};

const ARScreen = ({ navigation }: any) => {
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');
  const camera = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Pokémon spawning system
  const [spawnedPokemon, setSpawnedPokemon] = useState<SpawnedPokemon | null>(null);
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [caughtPokemonIds, setCaughtPokemonIds] = useState<Set<number>>(new Set());
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load all Pokémon data on mount
  useEffect(() => {
    (async () => {
      try {
        const pokeList = await fetchPokemonList();
        const pokemonDataList: PokemonData[] = pokeList.map((pokemon: any) => ({
          ...pokemon,
          imageUrl: pokemon.imageUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
        }));
        setAllPokemon(pokemonDataList);
        setIsLoading(false);
        // Spawn first pokémon
        spawnRandomPokemon(pokemonDataList);
      } catch (e) {
        console.error("Failed to fetch pokemon list", e);
        setIsLoading(false);
        Alert.alert("Error", "Could not load Pokémon data");
      }
    })();
  }, []);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Spawn new pokémon every 10-15 seconds (simulating encounters)
  useEffect(() => {
    if (allPokemon.length === 0) return;

    spawnIntervalRef.current = setInterval(() => {
      spawnRandomPokemon(allPokemon);
    }, 10000 + Math.random() * 5000);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [allPokemon]);

  function spawnRandomPokemon(pokemonList: PokemonData[]) {
    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const isCaught = caughtPokemonIds.has(randomPokemon.id);
    setSpawnedPokemon({
      ...randomPokemon,
      spawnedAt: Date.now(),
      isCaught,
    });
  }

  async function captureCurrentPokemon() {
    if (!spawnedPokemon) {
      Alert.alert("No Pokémon", "No Pokémon nearby to capture!");
      return;
    }

    try {
      // Take a photo with camera
      if (camera.current) {
        await camera.current.takePhoto({ flash: "off" });
      }

      // Save to Firebase using pokemonService
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
        // Update caught list
        const newCaughtIds = new Set(caughtPokemonIds);
        newCaughtIds.add(spawnedPokemon.id);
        setCaughtPokemonIds(newCaughtIds);
        // Spawn next pokémon after a short delay
        setTimeout(() => {
          spawnRandomPokemon(allPokemon);
        }, 1500);
      }
    } catch (err) {
      console.error("Capture error:", err);
      Alert.alert("Error", "Failed to capture Pokémon. Try again!");
    }
  }

  if (hasPermission === null || device == null || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={{ marginTop: 12, color: "#fff" }}>Loading...</Text>
      </View>
    );
  }
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          Camera permission required to play. Please grant access in settings.
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

      {/* Spawned Pokémon overlay */}
      {spawnedPokemon && (
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
          <Text style={styles.pokemonTypes}>
            {spawnedPokemon.types?.join(", ") || ""}
          </Text>
        </View>
      )}

      {/* No Pokémon nearby indicator */}
      {!spawnedPokemon && (
        <View style={styles.loadingIndicator}>
          <Text style={{ color: "#fff", fontSize: 16 }}>Searching for Pokémon...</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.captureBtn,
            !spawnedPokemon && styles.captureDisabled,
            spawnedPokemon?.isCaught && styles.captureCaught,
          ]}
          onPress={() => captureCurrentPokemon()}
          disabled={!spawnedPokemon || spawnedPokemon?.isCaught}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            {!spawnedPokemon ? "WAITING..." : spawnedPokemon.isCaught ? "ALREADY CAUGHT" : "CAPTURE"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={() => navigation.navigate("ProfileScreen")}
        >
          <Text style={{ color: "#fff", fontSize: 14 }}>📚 POKEDEX</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  pokemonContainer: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  sprite: {
    width: 240,
    height: 240,
    resizeMode: "contain",
  },
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
    spriteBoxCaught: {
      borderColor: "#4caf50",
      backgroundColor: "rgba(76, 175, 80, 0.1)",
    },
    caughtBadge: {
      position: "absolute",
      top: -10,
      backgroundColor: "#4caf50",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      zIndex: 20,
    },
    caughtBadgeText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 12,
    },
  pokemonName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  pokemonTypes: {
    color: "#ffd700",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingIndicator: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtn: {
    width: 160,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ef5350",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureDisabled: {
    backgroundColor: "#757575",
    opacity: 0.6,
  },
  captureCaught: {
    backgroundColor: "#4caf50",
    opacity: 0.8,
  },
  galleryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(33, 150, 243, 0.9)",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ARScreen;
function setIsLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

function setCaughtPokemonIds(caughtIds: Set<number>) {
  throw new Error("Function not implemented.");
}

