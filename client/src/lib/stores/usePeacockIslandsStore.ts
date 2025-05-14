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
  ActionType,
  HatcherySlot,
  Egg,
  BattleResult,
  FeatherInventory,
  BonusType
} from "../game/peacockIslands/types";
import { createEnemyWave } from "../game/peacockIslands/enemies";
import { simulateBattle, getEggBonusValue } from "../game/peacockIslands/battle";

// Başlangıç durumları için sabitler
const INITIAL_GOLD = 100;
const INITIAL_EGGS = 0;
const INITIAL_SOLDIERS = 5;
const INITIAL_SOLDIER_HEALTH = 30;
const INITIAL_SOLDIER_ATTACK = 10;
const PREPARATION_TIME = 60; // saniye
const INITIAL_BUILDING_LEVEL = 1;
const MAX_HATCHERY_SLOTS = 3;

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
  collectFeathers: (playerId: string, amount: number, color?: FeatherColor) => void;
  addFeathers: (playerId: string, feathers: FeatherInventory) => void;
  trainSoldiers: (playerId: string, amount: number) => void;
  upgradeBuilding: (playerId: string, buildingId: string) => void;
  combineFeathers: (playerId: string, color: FeatherColor, amount: number) => void;
  hatchEgg: (playerId: string, color: FeatherColor) => void;
  activateEgg: (playerId: string, slotId: string) => void;
  
  // Savaş eylemleri
  processBattle: () => BattleResult;
  
  // NPC eylemleri
  performNpcActions: () => void;
}

// Kuluçka yuvası oluşturma
const createHatcherySlot = (): HatcherySlot => {
  return {
    id: nanoid(),
    egg: null,
    isActive: false
  };
};

// Boş tüy envanteri
const createEmptyFeatherInventory = (): FeatherInventory => {
  return {
    green: 0,
    blue: 0,
    orange: 0
  };
};

// Ordu bonusları
const createInitialBonuses = () => {
  return {
    health: 0,
    attackPower: 0,
    attackSpeed: 0
  };
};

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

  // Kuluçka yuvaları
  const hatchery: HatcherySlot[] = Array(MAX_HATCHERY_SLOTS)
    .fill(null)
    .map(() => createHatcherySlot());

  return {
    id: nanoid(),
    name,
    owner: ownerId,
    resources: {
      gold: INITIAL_GOLD,
      eggs: INITIAL_EGGS
    },
    buildings,
    army: {
      soldiers: INITIAL_SOLDIERS,
      health: INITIAL_SOLDIER_HEALTH,
      attackPower: INITIAL_SOLDIER_ATTACK,
      attackSpeed: 0,
      bonuses: createInitialBonuses()
    },
    hatchery,
    featherInventory: createEmptyFeatherInventory()
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

// Yumurta oluşturma
const createEgg = (color: FeatherColor): Egg => {
  const { bonusType, bonusValue } = getEggBonusValue(color);
  
  return {
    id: nanoid(),
    color,
    bonusType: bonusType as BonusType,
    bonusValue
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
  lastBattleResult: null,
  
  // Oyun akışı eylemleri
  startGame: () => {
    set({
      currentPhase: "preparation",
      currentTurn: 1,
      preparationTimeLeft: PREPARATION_TIME,
      player: createPlayer("Oyuncu1", false),
      npc: createPlayer("BotX", true),
      currentEnemyWave: null,
      lastBattleResult: null
    });
  },
  
  resetGame: () => {
    set({
      currentPhase: "menu",
      currentTurn: 0,
      player: createPlayer("Oyuncu1", false),
      npc: createPlayer("BotX", true),
      preparationTimeLeft: PREPARATION_TIME,
      currentEnemyWave: null,
      lastBattleResult: null
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
  
  processBattle: () => {
    const { player, currentEnemyWave } = get();
    
    if (!currentEnemyWave) {
      throw new Error("No enemy wave to battle against");
    }
    
    // Savaş simülasyonu
    const battleResult = simulateBattle(player.island.army, currentEnemyWave);
    
    // Savaş sonucunu kaydet
    set({ lastBattleResult: battleResult });
    
    // Tüyleri topla (eğer kazandıysa)
    if (battleResult.playerVictory && battleResult.feathersCollected) {
      get().addFeathers(player.id, battleResult.feathersCollected);
    }
    
    return battleResult;
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
  collectFeathers: (playerId: string, amount: number, color?: FeatherColor) => {
    const { player, npc } = get();
    const goldCost = Math.floor(amount / 2); // Basit bir maliyet formülü
    
    // Rastgele renk veya belirtilen renk
    const featherColor = color || (Math.random() < 0.33 ? "green" : Math.random() < 0.5 ? "blue" : "orange");
    
    // Oyuncu ID'sine göre doğru oyuncuyu güncelle
    if (playerId === player.id && player.island.resources.gold >= goldCost) {
      const updatedFeatherInventory = { ...player.island.featherInventory };
      updatedFeatherInventory[featherColor] += amount;
      
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          featherInventory: updatedFeatherInventory,
          resources: {
            ...player.island.resources,
            gold: player.island.resources.gold - goldCost
          }
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.resources.gold >= goldCost) {
      const updatedFeatherInventory = { ...npc.island.featherInventory };
      updatedFeatherInventory[featherColor] += amount;
      
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          featherInventory: updatedFeatherInventory,
          resources: {
            ...npc.island.resources,
            gold: npc.island.resources.gold - goldCost
          }
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  // Tüyleri doğrudan ekle (savaş kazanımı gibi)
  addFeathers: (playerId: string, feathers: FeatherInventory) => {
    const { player, npc } = get();
    
    if (playerId === player.id) {
      const updatedFeatherInventory = { 
        green: player.island.featherInventory.green + feathers.green,
        blue: player.island.featherInventory.blue + feathers.blue,
        orange: player.island.featherInventory.orange + feathers.orange
      };
      
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          featherInventory: updatedFeatherInventory
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id) {
      const updatedFeatherInventory = { 
        green: npc.island.featherInventory.green + feathers.green,
        blue: npc.island.featherInventory.blue + feathers.blue,
        orange: npc.island.featherInventory.orange + feathers.orange
      };
      
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          featherInventory: updatedFeatherInventory
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
            ...player.island.army,
            soldiers: player.island.army.soldiers + amount
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
            ...npc.island.army,
            soldiers: npc.island.army.soldiers + amount
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
  
  combineFeathers: (playerId: string, color: FeatherColor, amount: number = 1) => {
    const { player, npc } = get();
    const requiredFeathers = 3 * amount; // Her yumurta için 3 tüy
    
    if (playerId === player.id && player.island.featherInventory[color] >= requiredFeathers) {
      const updatedFeatherInventory = { ...player.island.featherInventory };
      updatedFeatherInventory[color] -= requiredFeathers;
      
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          featherInventory: updatedFeatherInventory,
          resources: {
            ...player.island.resources,
            eggs: player.island.resources.eggs + amount
          }
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.featherInventory[color] >= requiredFeathers) {
      const updatedFeatherInventory = { ...npc.island.featherInventory };
      updatedFeatherInventory[color] -= requiredFeathers;
      
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          featherInventory: updatedFeatherInventory,
          resources: {
            ...npc.island.resources,
            eggs: npc.island.resources.eggs + amount
          }
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  hatchEgg: (playerId: string, color: FeatherColor) => {
    const { player, npc } = get();
    
    if (playerId === player.id && player.island.resources.eggs > 0) {
      // Boş kuluçka yuvası bul
      const hatcherySlotIndex = player.island.hatchery.findIndex(slot => slot.egg === null);
      
      if (hatcherySlotIndex === -1) {
        return; // Tüm yuvalar dolu
      }
      
      // Yeni yumurta oluştur
      const egg = createEgg(color);
      
      // Kuluçka yuvasını güncelle
      const updatedHatchery = [...player.island.hatchery];
      updatedHatchery[hatcherySlotIndex] = {
        ...player.island.hatchery[hatcherySlotIndex],
        egg
      };
      
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          resources: {
            ...player.island.resources,
            eggs: player.island.resources.eggs - 1
          },
          hatchery: updatedHatchery
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.resources.eggs > 0) {
      // Boş kuluçka yuvası bul
      const hatcherySlotIndex = npc.island.hatchery.findIndex(slot => slot.egg === null);
      
      if (hatcherySlotIndex === -1) {
        return; // Tüm yuvalar dolu
      }
      
      // Yeni yumurta oluştur
      const egg = createEgg(color);
      
      // Kuluçka yuvasını güncelle
      const updatedHatchery = [...npc.island.hatchery];
      updatedHatchery[hatcherySlotIndex] = {
        ...npc.island.hatchery[hatcherySlotIndex],
        egg
      };
      
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          resources: {
            ...npc.island.resources,
            eggs: npc.island.resources.eggs - 1
          },
          hatchery: updatedHatchery
        }
      };
      
      set({ npc: updatedNpc });
    }
  },
  
  activateEgg: (playerId: string, slotId: string) => {
    const { player, npc } = get();
    
    if (playerId === player.id) {
      // Kuluçka yuvasını bul
      const slotIndex = player.island.hatchery.findIndex(s => s.id === slotId);
      
      if (slotIndex === -1 || !player.island.hatchery[slotIndex].egg) {
        return; // Yuva yok veya yumurta yok
      }
      
      const slot = player.island.hatchery[slotIndex];
      const egg = slot.egg!;
      
      // Yumurtanın bonusunu uygula
      const updatedArmy = { ...player.island.army };
      const updatedBonuses = { ...updatedArmy.bonuses };
      
      switch (egg.bonusType) {
        case "health":
          updatedBonuses.health += egg.bonusValue;
          break;
        case "attackPower":
          updatedBonuses.attackPower += egg.bonusValue;
          break;
        case "attackSpeed":
          updatedBonuses.attackSpeed += egg.bonusValue;
          break;
      }
      
      updatedArmy.bonuses = updatedBonuses;
      
      // Yuvayı aktifleştir
      const updatedHatchery = [...player.island.hatchery];
      updatedHatchery[slotIndex] = {
        ...slot,
        isActive: true
      };
      
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          army: updatedArmy,
          hatchery: updatedHatchery
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id) {
      // Benzer NPC uygulaması
      const slotIndex = npc.island.hatchery.findIndex(s => s.id === slotId);
      
      if (slotIndex === -1 || !npc.island.hatchery[slotIndex].egg) {
        return;
      }
      
      const slot = npc.island.hatchery[slotIndex];
      const egg = slot.egg!;
      
      const updatedArmy = { ...npc.island.army };
      const updatedBonuses = { ...updatedArmy.bonuses };
      
      switch (egg.bonusType) {
        case "health":
          updatedBonuses.health += egg.bonusValue;
          break;
        case "attackPower":
          updatedBonuses.attackPower += egg.bonusValue;
          break;
        case "attackSpeed":
          updatedBonuses.attackSpeed += egg.bonusValue;
          break;
      }
      
      updatedArmy.bonuses = updatedBonuses;
      
      const updatedHatchery = [...npc.island.hatchery];
      updatedHatchery[slotIndex] = {
        ...slot,
        isActive: true
      };
      
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          army: updatedArmy,
          hatchery: updatedHatchery
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
    
    // Tüyleri kontrol et ve yumurta oluştur
    const { green, blue, orange } = npc.island.featherInventory;
    
    if (green >= 3) {
      get().combineFeathers(npc.id, "green");
      actions.push("combineFeathers");
    } else if (blue >= 3) {
      get().combineFeathers(npc.id, "blue");
      actions.push("combineFeathers");
    } else if (orange >= 3) {
      get().combineFeathers(npc.id, "orange");
      actions.push("combineFeathers");
    }
    
    // Yumurta varsa kuluçkaya yatır
    if (npc.island.resources.eggs > 0) {
      // Rastgele bir tüy rengi seç
      const colors: FeatherColor[] = ["green", "blue", "orange"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      get().hatchEgg(npc.id, randomColor);
      actions.push("hatchEgg");
      
      // Aktif olmayan kuluçka yuvaları varsa, aktifleştir
      const inactiveSlot = npc.island.hatchery.find(slot => slot.egg && !slot.isActive);
      if (inactiveSlot) {
        get().activateEgg(npc.id, inactiveSlot.id);
        actions.push("activateEgg");
      }
    }
    
    // NPC yapay zekası için daha karmaşık stratejiler eklenebilir
    console.log("NPC performed actions:", actions);
  }
}));