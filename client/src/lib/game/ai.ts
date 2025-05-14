import { useGameStore } from "../stores/useGameStore";
import { HexCoordinates } from "./types";

/**
 * Find valid placement positions for AI
 */
const getValidPlacements = () => {
  const { placedCards } = useGameStore.getState();
  const validPositions: HexCoordinates[] = [];
  
  // AI places cards on the negative Z side (top half of board)
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 0; r++) {
      // Skip invalid positions
      if (Math.abs(q + r) > 3) continue;
      
      const position: HexCoordinates = { q, r, s: -q-r };
      
      // Check if position is already occupied
      const isOccupied = placedCards.some(
        card => card.position.q === position.q && card.position.r === position.r
      );
      
      if (!isOccupied) {
        validPositions.push(position);
      }
    }
  }
  
  return validPositions;
};

/**
 * Find the class that counters the most player cards
 */
const findCounterClass = () => {
  const { placedCards } = useGameStore.getState();
  
  // Count player card classes
  const playerCards = placedCards.filter(card => card.owner === "player");
  let warriorCount = 0;
  let mageCount = 0;
  let rogueCount = 0;
  
  playerCards.forEach(card => {
    if (card.class === "warrior") warriorCount++;
    else if (card.class === "mage") mageCount++;
    else if (card.class === "rogue") rogueCount++;
  });
  
  // Find the counter class
  // Warriors counter Mages, Mages counter Rogues, Rogues counter Warriors
  if (mageCount >= warriorCount && mageCount >= rogueCount) {
    return "warrior"; // Counter mages with warriors
  } else if (rogueCount >= warriorCount && rogueCount >= mageCount) {
    return "mage"; // Counter rogues with mages
  } else {
    return "rogue"; // Counter warriors with rogues
  }
};

/**
 * Process AI turn logic
 */
export const processAITurn = () => {
  const { enemyHand, enemyMana, placeCard } = useGameStore.getState();
  
  // Get valid placement positions
  const validPositions = getValidPlacements();
  if (validPositions.length === 0) return;
  
  // Find the counter class
  const counterClass = findCounterClass();
  
  // Sort cards by strategic value
  const sortedHand = [...enemyHand].sort((a, b) => {
    // Prioritize counter class cards
    if (a.class === counterClass && b.class !== counterClass) return -1;
    if (a.class !== counterClass && b.class === counterClass) return 1;
    
    // Then prioritize by rarity/power
    const rarityOrder = { legendary: 3, epic: 2, rare: 1, common: 0 };
    if (rarityOrder[a.rarity as keyof typeof rarityOrder] !== rarityOrder[b.rarity as keyof typeof rarityOrder]) {
      return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
    }
    
    // Finally sort by attack value
    return b.attack - a.attack;
  });
  
  // Place up to 3 cards or as many as mana allows
  let remainingMana = enemyMana;
  let cardsPlaced = 0;
  
  sortedHand.forEach(card => {
    // Only place up to 3 cards per turn
    if (cardsPlaced >= 3) return;
    
    // Calculate card cost (roughly based on power)
    const cardCost = Math.ceil((card.attack + card.health) / 4);
    
    if (cardCost <= remainingMana) {
      // Choose a random valid position
      const randomIndex = Math.floor(Math.random() * validPositions.length);
      const position = validPositions[randomIndex];
      
      // Place the card
      placeCard(card, position);
      
      // Update remaining mana and cards placed
      remainingMana -= cardCost;
      cardsPlaced++;
      
      // Remove this position from valid positions
      validPositions.splice(randomIndex, 1);
      
      console.log(`AI placed ${card.name} at position (${position.q}, ${position.r})`);
    }
  });
  
  console.log(`AI turn complete. Placed ${cardsPlaced} cards.`);
};
