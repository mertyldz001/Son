import { create } from "zustand";
import { nanoid } from "nanoid";
import { 
  GameState, 
  Player, 
  Island, 
  Building, 
  EnemyWave, 
  GamePhase,
  FeatherColor,
  Feather,
  BuildingType,
  ActionType
} from "../game/peacockIslands/types";

// Başlangıç durumları için sabitler
const INITIAL_GOLD = 100;
const INITIAL_FEATHERS = 0;
const INITIAL_EGGS = 0;
const INITIAL_SOLDIERS = 5;
const PREPARATION_TIME = 60; // saniye
const INITIAL_BUILDING_LEVEL = 1;

// Oyun mağazası için tip
interface PeacockIslandsStore extends GameState {
  // Oyun akışı eylemleri
  startGame: () => void;
  resetGame: () => void;
  endPreparationPhase: () => void;
  startBattlePhase: () => void;
  endBattlePhase: (playerWon: boolean) => void;
  updatePreparationTime: (delta: number) => void;
  
  // Oyuncu eylemleri
  collectFeathers: (playerId: string, amount: number) => void;
  trainSoldiers: (playerId: string, amount: number) => void;
  upgradeBuilding: (playerId: string, buildingId: string) => void;
  combineFeathers: (playerId: string, colors: FeatherColor[]) => void;
  hatchEgg: (playerId: string) => void;
  
  // NPC eylemleri
  performNpcActions: () => void;
}

// Ada oluşturma yardımcı fonksiyonu
const createIsland = (ownerId: string, name: string): Island => {
  const buildings: Building[] = [
    {
      id: nanoid(),
      type: "barracks",
      level: INITIAL_BUILDING_LEVEL,
      productionRate: 1
    },
    {
      id: nanoid(),
      type: "mine",
      level: INITIAL_BUILDING_LEVEL,
      productionRate: 2
    },
    {
      id: nanoid(),
      type: "hatchery",
      level: INITIAL_BUILDING_LEVEL,
      productionRate: 1
    }
  ];

  return {
    id: nanoid(),
    name,
    owner: ownerId,
    resources: {
      gold: INITIAL_GOLD,
      feathers: INITIAL_FEATHERS,
      eggs: INITIAL_EGGS
    },
    buildings,
    army: {
      soldiers: INITIAL_SOLDIERS,
      power: INITIAL_SOLDIERS * 10
    }
  };
};

// Oyuncu oluşturma yardımcı fonksiyonu
const createPlayer = (name: string, isBot: boolean): Player => {
  const playerId = nanoid();
  const islandName = isBot ? "Bot Adası" : "Oyuncu Adası";
  
  return {
    id: playerId,
    name,
    isBot,
    island: createIsland(playerId, islandName)
  };
};

// Düşman dalgası oluşturma yardımcı fonksiyonu
const createEnemyWave = (level: number): EnemyWave => {
  return {
    id: nanoid(),
    level,
    power: level * 25, // Basit bir formül, seviyeye göre güç artışı
    defeated: false
  };
};

// Oyun mağazasını oluştur
export const usePeacockIslandsStore = create<PeacockIslandsStore>((set, get) => ({
  // Başlangıç durumu
  currentPhase: "menu",
  currentTurn: 0,
  player: createPlayer("Oyuncu1", false),
  npc: createPlayer("BotX", true),
  preparationTimeLeft: PREPARATION_TIME,
  currentEnemyWave: null,
  
  // Oyun akışı eylemleri
  startGame: () => {
    set({
      currentPhase: "preparation",
      currentTurn: 1,
      preparationTimeLeft: PREPARATION_TIME,
      player: createPlayer("Oyuncu1", false),
      npc: createPlayer("BotX", true),
      currentEnemyWave: null
    });
  },
  
  resetGame: () => {
    set({
      currentPhase: "menu",
      currentTurn: 0,
      player: createPlayer("Oyuncu1", false),
      npc: createPlayer("BotX", true),
      preparationTimeLeft: PREPARATION_TIME,
      currentEnemyWave: null
    });
  },
  
  endPreparationPhase: () => {
    const { currentTurn } = get();
    set({ 
      currentPhase: "battle",
      currentEnemyWave: createEnemyWave(currentTurn)
    });
  },
  
  startBattlePhase: () => {
    set({ currentPhase: "battle" });
  },
  
  endBattlePhase: (playerWon: boolean) => {
    const { currentTurn, player, npc } = get();
    
    // Eğer oyuncu kazandıysa, ödül olarak altın ekle
    if (playerWon) {
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          resources: {
            ...player.island.resources,
            gold: player.island.resources.gold + currentTurn * 20
          }
        }
      };
      
      // NPC sürekli kaybederse altını artsın
      const updatedNpc = {
        ...npc,
        island: {
          ...npc.island,
          resources: {
            ...npc.island.resources,
            gold: npc.island.resources.gold + currentTurn * 15
          }
        }
      };
      
      set({ 
        currentPhase: "preparation",
        currentTurn: currentTurn + 1,
        preparationTimeLeft: PREPARATION_TIME,
        currentEnemyWave: null,
        player: updatedPlayer,
        npc: updatedNpc
      });
    } else {
      // Oyuncu kaybettiyse oyun biter
      set({ currentPhase: "gameOver" });
    }
  },
  
  updatePreparationTime: (delta: number) => {
    const { preparationTimeLeft, currentPhase } = get();
    
    if (currentPhase === "preparation") {
      const newTime = Math.max(0, preparationTimeLeft - delta);
      set({ preparationTimeLeft: newTime });
      
      // Süre bittiyse hazırlık fazını bitir
      if (newTime <= 0) {
        get().endPreparationPhase();
      }
    }
  },
  
  // Oyuncu eylemleri
  collectFeathers: (playerId: string, amount: number) => {
    const { player, npc } = get();
    
    // Oyuncu ID'sine göre doğru oyuncuyu güncelle
    if (playerId === player.id) {
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          resources: {
            ...player.island.resources,
            feathers: player.island.resources.feathers + amount,
            gold: player.island.resources.gold - Math.floor(amount / 2) // Basit bir maliyet formülü
          }
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id) {
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          resources: {
            ...npc.island.resources,
            feathers: npc.island.resources.feathers + amount,
            gold: npc.island.resources.gold - Math.floor(amount / 2)
          }
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  trainSoldiers: (playerId: string, amount: number) => {
    const { player, npc } = get();
    const goldCost = amount * 5; // Her asker 5 altın
    
    if (playerId === player.id && player.island.resources.gold >= goldCost) {
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          resources: {
            ...player.island.resources,
            gold: player.island.resources.gold - goldCost
          },
          army: {
            soldiers: player.island.army.soldiers + amount,
            power: player.island.army.power + (amount * 10) // Her asker 10 güç
          }
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.resources.gold >= goldCost) {
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          resources: {
            ...npc.island.resources,
            gold: npc.island.resources.gold - goldCost
          },
          army: {
            soldiers: npc.island.army.soldiers + amount,
            power: npc.island.army.power + (amount * 10)
          }
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  upgradeBuilding: (playerId: string, buildingId: string) => {
    const { player, npc } = get();
    
    if (playerId === player.id) {
      const buildingIndex = player.island.buildings.findIndex(b => b.id === buildingId);
      
      if (buildingIndex !== -1) {
        const building = player.island.buildings[buildingIndex];
        const upgradeCost = building.level * 30; // Seviye başına 30 altın
        
        if (player.island.resources.gold >= upgradeCost) {
          const updatedBuildings = [...player.island.buildings];
          updatedBuildings[buildingIndex] = {
            ...building,
            level: building.level + 1,
            productionRate: building.productionRate + 1
          };
          
          const updatedPlayer = { 
            ...player,
            island: {
              ...player.island,
              resources: {
                ...player.island.resources,
                gold: player.island.resources.gold - upgradeCost
              },
              buildings: updatedBuildings
            }
          };
          
          set({ player: updatedPlayer });
        }
      }
    } else if (playerId === npc.id) {
      const buildingIndex = npc.island.buildings.findIndex(b => b.id === buildingId);
      
      if (buildingIndex !== -1) {
        const building = npc.island.buildings[buildingIndex];
        const upgradeCost = building.level * 30;
        
        if (npc.island.resources.gold >= upgradeCost) {
          const updatedBuildings = [...npc.island.buildings];
          updatedBuildings[buildingIndex] = {
            ...building,
            level: building.level + 1,
            productionRate: building.productionRate + 1
          };
          
          const updatedNpc = { 
            ...npc,
            island: {
              ...npc.island,
              resources: {
                ...npc.island.resources,
                gold: npc.island.resources.gold - upgradeCost
              },
              buildings: updatedBuildings
            }
          };
          
          set({ npc: updatedNpc });
        }
      }
    }
  },
  
  combineFeathers: (playerId: string, colors: FeatherColor[]) => {
    // Basit bir kurallar: 3 aynı renk tüy -> 1 yumurta
    if (colors.length !== 3 || colors[0] !== colors[1] || colors[1] !== colors[2]) {
      return; // Aynı renk değilse işlem yapma
    }
    
    const { player, npc } = get();
    
    if (playerId === player.id && player.island.resources.feathers >= 3) {
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          resources: {
            ...player.island.resources,
            feathers: player.island.resources.feathers - 3,
            eggs: player.island.resources.eggs + 1
          }
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.resources.feathers >= 3) {
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          resources: {
            ...npc.island.resources,
            feathers: npc.island.resources.feathers - 3,
            eggs: npc.island.resources.eggs + 1
          }
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  hatchEgg: (playerId: string) => {
    const { player, npc } = get();
    
    if (playerId === player.id && player.island.resources.eggs > 0) {
      // Yumurtadan güç elde edilir
      const powerBoost = 20;
      
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          resources: {
            ...player.island.resources,
            eggs: player.island.resources.eggs - 1
          },
          army: {
            ...player.island.army,
            power: player.island.army.power + powerBoost
          }
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.resources.eggs > 0) {
      const powerBoost = 20;
      
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          resources: {
            ...npc.island.resources,
            eggs: npc.island.resources.eggs - 1
          },
          army: {
            ...npc.island.army,
            power: npc.island.army.power + powerBoost
          }
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  // NPC eylemleri
  performNpcActions: () => {
    const { npc } = get();
    const actions: ActionType[] = [];
    
    // Altın miktarına göre yapılacak eylemleri belirle
    if (npc.island.resources.gold >= 50) {
      // Askerlere yatırım yap
      get().trainSoldiers(npc.id, 5);
      actions.push("trainSoldiers");
    }
    
    if (npc.island.resources.gold >= 30) {
      // Tüy topla
      get().collectFeathers(npc.id, 3);
      actions.push("collectFeathers");
    }
    
    // Eğer yeterli tüy varsa, yumurta oluştur
    if (npc.island.resources.feathers >= 3) {
      get().combineFeathers(npc.id, ["red", "red", "red"]);
      actions.push("combineFeathers");
    }
    
    // Yumurta varsa kuluçkaya yatır
    if (npc.island.resources.eggs > 0) {
      get().hatchEgg(npc.id);
      actions.push("hatchEgg");
    }
    
    // NPC yapay zekası için daha karmaşık stratejiler eklenebilir
    console.log("NPC performed actions:", actions);
  }
}));