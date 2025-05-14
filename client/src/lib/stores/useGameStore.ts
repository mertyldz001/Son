import { create } from "zustand";
import { getChampion, getStarterDeck } from "../game/champions";
import { HexCoordinates, CardType, GamePhase } from "../game/types";
import { nanoid } from "nanoid";

interface GameStore {
  // Game state
  gamePhase: GamePhase;
  round: number;
  playerHealth: number;
  enemyHealth: number;
  playerMana: number;
  enemyMana: number;
  
  // Cards and board state
  playerDeck: CardType[];
  enemyDeck: CardType[];
  playerHand: CardType[];
  enemyHand: CardType[];
  placedCards: CardType[];
  selectedCard: CardType | null;
  hoveredHex: HexCoordinates | null;
  
  // Game actions
  resetBoard: () => void;
  startGame: () => void;
  resetGame: () => void;
  drawCard: (player: "player" | "enemy") => void;
  setSelectedCard: (card: CardType | null) => void;
  setHoveredHex: (hex: HexCoordinates | null) => void;
  placeCard: (card: CardType, position: HexCoordinates) => void;
  endPlayerTurn: () => void;
  damagePlayer: (amount: number) => void;
  damageEnemy: (amount: number) => void;
  setGamePhase: (phase: GamePhase) => void;
}

const INITIAL_HEALTH = 20;
const INITIAL_MANA = 3;
const MAX_HAND_SIZE = 5;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial game state
  gamePhase: "menu",
  round: 1,
  playerHealth: INITIAL_HEALTH,
  enemyHealth: INITIAL_HEALTH,
  playerMana: INITIAL_MANA,
  enemyMana: INITIAL_MANA,
  
  // Initial cards state
  playerDeck: [],
  enemyDeck: [],
  playerHand: [],
  enemyHand: [],
  placedCards: [],
  selectedCard: null,
  hoveredHex: null,
  
  // Reset the board to initial state
  resetBoard: () => {
    const playerDeck = getStarterDeck("player");
    const enemyDeck = getStarterDeck("enemy");
    
    set({
      playerDeck,
      enemyDeck,
      playerHand: [],
      enemyHand: [],
      placedCards: [],
      selectedCard: null,
      hoveredHex: null,
      round: 1,
      playerHealth: INITIAL_HEALTH,
      enemyHealth: INITIAL_HEALTH,
      playerMana: INITIAL_MANA,
      enemyMana: INITIAL_MANA
    });
    
    // Draw initial hands
    for (let i = 0; i < 3; i++) {
      get().drawCard("player");
      get().drawCard("enemy");
    }
  },
  
  // Start a new game
  startGame: () => {
    set({ gamePhase: "playing" });
    get().resetBoard();
  },
  
  // Reset the game to menu state
  resetGame: () => {
    set({ gamePhase: "menu" });
  },
  
  // Draw a card from deck to hand
  drawCard: (player: "player" | "enemy") => {
    const { playerDeck, enemyDeck, playerHand, enemyHand } = get();
    
    if (player === "player") {
      if (playerDeck.length === 0 || playerHand.length >= MAX_HAND_SIZE) return;
      
      const deck = [...playerDeck];
      const card = deck.pop()!;
      
      set({
        playerDeck: deck,
        playerHand: [...playerHand, card]
      });
    } else {
      if (enemyDeck.length === 0 || enemyHand.length >= MAX_HAND_SIZE) return;
      
      const deck = [...enemyDeck];
      const card = deck.pop()!;
      
      set({
        enemyDeck: deck,
        enemyHand: [...enemyHand, card]
      });
    }
  },
  
  // Set the selected card
  setSelectedCard: (card: CardType | null) => {
    set({ selectedCard: card });
  },
  
  // Set the hovered hex coordinates
  setHoveredHex: (hex: HexCoordinates | null) => {
    set({ hoveredHex: hex });
  },
  
  // Place a card from hand onto the board
  placeCard: (card: CardType, position: HexCoordinates) => {
    const { playerHand, enemyHand, placedCards } = get();
    
    // Check if position is already occupied
    const isOccupied = placedCards.some(
      c => c.position.q === position.q && c.position.r === position.r
    );
    
    if (isOccupied) return;
    
    // Create new placed card
    const placedCard = {
      ...card,
      position,
      isAttacking: false
    };
    
    if (card.owner === "player") {
      // Update player hand
      set({
        playerHand: playerHand.filter(c => c.id !== card.id),
        placedCards: [...placedCards, placedCard],
        selectedCard: null
      });
    } else {
      // Update enemy hand
      set({
        enemyHand: enemyHand.filter(c => c.id !== card.id),
        placedCards: [...placedCards, placedCard]
      });
    }
  },
  
  // End the player's turn and start enemy turn
  endPlayerTurn: () => {
    const { round } = get();
    
    // Update mana for next round
    const newMana = Math.min(round + 2, 10);
    
    set({
      gamePhase: "enemyTurn",
      playerMana: newMana,
      enemyMana: newMana
    });
    
    // Draw a card for next round
    get().drawCard("player");
    get().drawCard("enemy");
  },
  
  // Damage player health
  damagePlayer: (amount: number) => {
    const { playerHealth } = get();
    const newHealth = Math.max(0, playerHealth - amount);
    
    set({ playerHealth: newHealth });
    
    // Check for game over
    if (newHealth <= 0) {
      set({ gamePhase: "gameOver" });
    }
  },
  
  // Damage enemy health
  damageEnemy: (amount: number) => {
    const { enemyHealth } = get();
    const newHealth = Math.max(0, enemyHealth - amount);
    
    set({ enemyHealth: newHealth });
    
    // Check for game over
    if (newHealth <= 0) {
      set({ gamePhase: "gameOver" });
    }
  },
  
  // Set the game phase
  setGamePhase: (phase: GamePhase) => {
    set({ gamePhase: phase });
    
    // If a new round is starting, increment round counter
    if (phase === "playing" && get().gamePhase === "enemyTurn") {
      set(state => ({ round: state.round + 1 }));
    }
  }
}));
