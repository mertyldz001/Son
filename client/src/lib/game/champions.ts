import { nanoid } from "nanoid";
import { CardType } from "./types";

// Champion classes
const CLASSES = ["warrior", "mage", "rogue"];

// Champion rarities
const RARITIES = ["common", "rare", "epic", "legendary"];

// Template champions
const CHAMPIONS = [
  // Warriors
  { 
    name: "Şövalye", 
    class: "warrior", 
    attack: 4, 
    health: 6, 
    rarity: "common" 
  },
  { 
    name: "Kızgın Savaşçı", 
    class: "warrior", 
    attack: 6, 
    health: 4, 
    rarity: "rare" 
  },
  { 
    name: "Kutsal Şövalye", 
    class: "warrior", 
    attack: 3, 
    health: 8, 
    rarity: "rare" 
  },
  { 
    name: "Gladyatör", 
    class: "warrior", 
    attack: 7, 
    health: 5, 
    rarity: "epic" 
  },
  { 
    name: "Savaş Lordu", 
    class: "warrior", 
    attack: 8, 
    health: 8, 
    rarity: "legendary" 
  },
  
  // Mages
  { 
    name: "Çırak", 
    class: "mage", 
    attack: 3, 
    health: 3, 
    rarity: "common" 
  },
  { 
    name: "Büyücü", 
    class: "mage", 
    attack: 5, 
    health: 3, 
    rarity: "rare" 
  },
  { 
    name: "Sihirdar", 
    class: "mage", 
    attack: 2, 
    health: 7, 
    rarity: "rare" 
  },
  { 
    name: "Usta Büyücü", 
    class: "mage", 
    attack: 6, 
    health: 4, 
    rarity: "epic" 
  },
  { 
    name: "Baş Büyücü", 
    class: "mage", 
    attack: 7, 
    health: 7, 
    rarity: "legendary" 
  },
  
  // Rogues
  { 
    name: "Hırsız", 
    class: "rogue", 
    attack: 2, 
    health: 4, 
    rarity: "common" 
  },
  { 
    name: "Suikastçı", 
    class: "rogue", 
    attack: 7, 
    health: 2, 
    rarity: "rare" 
  },
  { 
    name: "İzci", 
    class: "rogue", 
    attack: 4, 
    health: 4, 
    rarity: "rare" 
  },
  { 
    name: "Gizli Ajan", 
    class: "rogue", 
    attack: 5, 
    health: 6, 
    rarity: "epic" 
  },
  { 
    name: "Gölge Kılıcı", 
    class: "rogue", 
    attack: 9, 
    health: 6, 
    rarity: "legendary" 
  }
];

/**
 * Create a card based on champion template
 */
export const getChampion = (
  championName: string,
  owner: "player" | "enemy"
): CardType => {
  const championTemplate = CHAMPIONS.find(c => c.name === championName);
  
  if (!championTemplate) {
    throw new Error(`Champion "${championName}" not found`);
  }
  
  return {
    id: nanoid(),
    name: championTemplate.name,
    class: championTemplate.class,
    attack: championTemplate.attack,
    health: championTemplate.health,
    rarity: championTemplate.rarity,
    owner,
    position: { q: 0, r: 0, s: 0 },
    isAttacking: false
  };
};

/**
 * Get a random champion card
 */
export const getRandomChampion = (
  owner: "player" | "enemy",
  preferredClass?: string,
  minRarity?: string
): CardType => {
  // Filter champions by class if specified
  let availableChampions = [...CHAMPIONS];
  
  if (preferredClass) {
    availableChampions = availableChampions.filter(c => c.class === preferredClass);
  }
  
  if (minRarity) {
    const rarityIndex = RARITIES.indexOf(minRarity);
    availableChampions = availableChampions.filter(c => 
      RARITIES.indexOf(c.rarity) >= rarityIndex
    );
  }
  
  // If no champions are available after filtering, use all champions
  if (availableChampions.length === 0) {
    availableChampions = [...CHAMPIONS];
  }
  
  // Pick a random champion
  const randomIndex = Math.floor(Math.random() * availableChampions.length);
  const champion = availableChampions[randomIndex];
  
  return getChampion(champion.name, owner);
};

/**
 * Generate a starter deck for a player
 */
export const getStarterDeck = (owner: "player" | "enemy"): CardType[] => {
  const deck: CardType[] = [];
  
  // Add some common cards of each class
  CLASSES.forEach(className => {
    for (let i = 0; i < 2; i++) {
      deck.push(getRandomChampion(owner, className, "common"));
    }
  });
  
  // Add some rare cards
  for (let i = 0; i < 3; i++) {
    deck.push(getRandomChampion(owner, undefined, "rare"));
  }
  
  // Add some epic cards
  for (let i = 0; i < 2; i++) {
    deck.push(getRandomChampion(owner, undefined, "epic"));
  }
  
  // Add a legendary card
  deck.push(getRandomChampion(owner, undefined, "legendary"));
  
  // Shuffle the deck
  return deck.sort(() => Math.random() - 0.5);
};
