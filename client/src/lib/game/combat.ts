import { useGameStore } from "../stores/useGameStore";
import { CardType } from "./types";

/**
 * Get class advantage multiplier
 */
const getClassAdvantage = (attacker: CardType, defender: CardType): number => {
  // Warriors beat Mages, Mages beat Rogues, Rogues beat Warriors
  if (
    (attacker.class === "warrior" && defender.class === "mage") ||
    (attacker.class === "mage" && defender.class === "rogue") ||
    (attacker.class === "rogue" && defender.class === "warrior")
  ) {
    return 1.5; // 50% bonus damage
  }
  
  if (
    (attacker.class === "mage" && defender.class === "warrior") ||
    (attacker.class === "rogue" && defender.class === "mage") ||
    (attacker.class === "warrior" && defender.class === "rogue")
  ) {
    return 0.7; // 30% reduced damage
  }
  
  return 1.0; // No advantage or disadvantage
};

/**
 * Find pairs of cards that will attack each other
 */
const findCombatPairs = (playerCards: CardType[], enemyCards: CardType[]) => {
  const pairs: [CardType, CardType][] = [];
  
  // Simple algorithm: closest cards attack each other
  playerCards.forEach(playerCard => {
    if (enemyCards.length === 0) return;
    
    // Find the closest enemy card
    let closestEnemy: CardType | null = null;
    let closestDistance = Infinity;
    
    enemyCards.forEach(enemyCard => {
      const distance = Math.sqrt(
        Math.pow(playerCard.position.q - enemyCard.position.q, 2) +
        Math.pow(playerCard.position.r - enemyCard.position.r, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemyCard;
      }
    });
    
    if (closestEnemy) {
      pairs.push([playerCard, closestEnemy]);
      
      // Remove the enemy card from consideration for other player cards
      enemyCards = enemyCards.filter(card => card.id !== closestEnemy!.id);
    }
  });
  
  return pairs;
};

/**
 * Process combat between cards
 */
export const processCombat = (playHitSound: () => void) => {
  const { 
    placedCards, 
    damagePlayer,
    damageEnemy
  } = useGameStore.getState();
  
  // Split cards by owner
  const playerCards = placedCards.filter(card => card.owner === "player");
  const enemyCards = placedCards.filter(card => card.owner === "enemy");
  
  console.log(`Combat beginning: ${playerCards.length} player cards vs ${enemyCards.length} enemy cards`);
  
  // Get combat pairs
  const combatPairs = findCombatPairs(playerCards, [...enemyCards]);
  
  // Process combat for each pair
  let totalPlayerDamage = 0;
  let totalEnemyDamage = 0;
  
  combatPairs.forEach(([playerCard, enemyCard]) => {
    // Calculate damage with class advantages
    const playerAdvantage = getClassAdvantage(playerCard, enemyCard);
    const enemyAdvantage = getClassAdvantage(enemyCard, playerCard);
    
    const playerDamage = Math.round(playerCard.attack * playerAdvantage);
    const enemyDamage = Math.round(enemyCard.attack * enemyAdvantage);
    
    console.log(`Combat: ${playerCard.name} (${playerDamage}) vs ${enemyCard.name} (${enemyDamage})`);
    
    // Play hit sound
    playHitSound();
    
    // Calculate remaining health
    const playerCardNewHealth = playerCard.health - enemyDamage;
    const enemyCardNewHealth = enemyCard.health - playerDamage;
    
    // Update card health
    const updatedCards = useGameStore.getState().placedCards.map(card => {
      if (card.id === playerCard.id) {
        return { ...card, health: playerCardNewHealth, isAttacking: true };
      } else if (card.id === enemyCard.id) {
        return { ...card, health: enemyCardNewHealth, isAttacking: true };
      }
      return card;
    });
    
    // Remove cards with 0 or less health
    const survivingCards = updatedCards.filter(card => card.health > 0);
    
    // Update the game state
    useGameStore.setState({ placedCards: survivingCards });
    
    // If a card is destroyed, damage goes to player/enemy
    if (playerCardNewHealth <= 0) {
      const overkillDamage = Math.abs(playerCardNewHealth);
      if (overkillDamage > 0) {
        totalEnemyDamage += 1; // 1 damage per destroyed card
      }
    }
    
    if (enemyCardNewHealth <= 0) {
      const overkillDamage = Math.abs(enemyCardNewHealth);
      if (overkillDamage > 0) {
        totalPlayerDamage += 1; // 1 damage per destroyed card
      }
    }
  });
  
  // Process direct damage for unmatched cards
  const remainingPlayerCards = useGameStore.getState().placedCards.filter(
    card => card.owner === "player" && !card.isAttacking
  );
  
  const remainingEnemyCards = useGameStore.getState().placedCards.filter(
    card => card.owner === "enemy" && !card.isAttacking
  );
  
  // Unmatched cards deal direct damage
  remainingPlayerCards.forEach(card => {
    totalPlayerDamage += card.attack;
    
    // Update the card to show it attacked
    useGameStore.setState(state => ({
      placedCards: state.placedCards.map(c => 
        c.id === card.id ? { ...c, isAttacking: true } : c
      )
    }));
  });
  
  remainingEnemyCards.forEach(card => {
    totalEnemyDamage += card.attack;
    
    // Update the card to show it attacked
    useGameStore.setState(state => ({
      placedCards: state.placedCards.map(c => 
        c.id === card.id ? { ...c, isAttacking: true } : c
      )
    }));
  });
  
  // Apply damage to players
  if (totalPlayerDamage > 0) {
    damageEnemy(totalPlayerDamage);
    console.log(`Player dealt ${totalPlayerDamage} damage to enemy`);
  }
  
  if (totalEnemyDamage > 0) {
    damagePlayer(totalEnemyDamage);
    console.log(`Enemy dealt ${totalEnemyDamage} damage to player`);
  }
  
  // Reset attacking state after combat resolution
  setTimeout(() => {
    useGameStore.setState(state => ({
      placedCards: state.placedCards.map(card => ({ ...card, isAttacking: false }))
    }));
  }, 1000);
};
