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
  BonusType,
  Unit
} from "../game/peacockIslands/types";

// Çoklu oyuncu savaş mekanikleri
import { 
  simulatePlayerBattle,
  simulateDetailedBattle
} from "../game/peacockIslands/multiplayer";
import { createEnemyWave } from "../game/peacockIslands/enemies";
import { simulateBattle, getEggBonusValue } from "../game/peacockIslands/battle";

// Başlangıç durumları için sabitler
const INITIAL_GOLD = 16; // 16 altın ile başlasın
const INITIAL_EGGS = 0;
const INITIAL_SOLDIERS = 0; // Artık başlangıçta asker yok, marketten alınacak
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
  
  // Birim eylemleri
  addUnitToPlayer: (playerId: string, units: Unit[]) => void;
  
  // Birim yerleştirme eylemleri
  deployUnit: (playerId: string, unitId: string, position: {q: number, r: number, s: number}) => void;
  undeployUnit: (playerId: string, unitId: string) => void;
  
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
    isActive: false,
    status: "empty"
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
    featherInventory: createEmptyFeatherInventory(),
    units: [], // Başlangıçta boş birim dizisi
    gold: INITIAL_GOLD // Ada için altın miktarı
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
    bonusValue,
    ready: false,
    hatchTime: 20 // 20 saniye içinde hazır olacak
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
  actionLog: [],
  battleLog: [],
  advancedMode: true, // Advanced modu aktif edelim
  
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
    
    // Eğer oyuncu kazandıysa, 4 altın ödül ekle
    if (playerWon) {
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          gold: player.island.gold + 4 // Kazanırsa 4 altın
        }
      };
      
      // NPC'nin durumu değişmez
      const updatedNpc = {
        ...npc
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
      // Oyuncu kaybettiyse 2 altın ekle
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          gold: player.island.gold + 2 // Kaybederse 2 altın
        }
      };
      
      const updatedNpc = {
        ...npc
      };
      
      set({ 
        currentPhase: "preparation",
        currentTurn: currentTurn + 1,
        preparationTimeLeft: PREPARATION_TIME,
        currentEnemyWave: null,
        player: updatedPlayer,
        npc: updatedNpc
      });
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
    
    // Eğer amount negatifse, altın kazandır (test için)
    if (amount < 0) {
      if (playerId === player.id) {
        const goldEarned = Math.abs(amount) * 2; // Her birim için 2 altın
        const updatedPlayer = { 
          ...player,
          island: {
            ...player.island,
            gold: player.island.gold + goldEarned
          }
        };
        set({ player: updatedPlayer });
      } else if (playerId === npc.id) {
        const goldEarned = Math.abs(amount) * 2;
        const updatedNpc = { 
          ...npc,
          island: {
            ...npc.island,
            gold: npc.island.gold + goldEarned
          }
        };
        set({ npc: updatedNpc });
      }
      return;
    }
    
    // Normal asker eğitimi
    const goldCost = amount * 2; // Her asker 2 altın (Markette her asker 2 altın)
    
    if (playerId === player.id && player.island.gold >= goldCost) {
      const updatedPlayer = { 
        ...player,
        island: {
          ...player.island,
          gold: player.island.gold - goldCost
        }
      };
      
      set({ player: updatedPlayer });
    } else if (playerId === npc.id && npc.island.gold >= goldCost) {
      const updatedNpc = { 
        ...npc,
        island: {
          ...npc.island,
          gold: npc.island.gold - goldCost
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
        egg,
        status: "incubating"
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
        egg,
        status: "incubating"
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
        isActive: true,
        status: "ready"
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
        isActive: true,
        status: "ready"
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
  // Birim ekleme fonksiyonu
  addUnitToPlayer: (playerId: string, units: Unit[]) => {
    set((state) => {
      // Mevcut durumda sadece bir oyuncu var (çoklu oyuncu desteği için gelecekte genişletilebilir)
      if (playerId === state.player.id) {
        const updatedPlayer = { 
          ...state.player,
          island: {
            ...state.player.island,
            units: [...state.player.island.units, ...units]
          }
        };
        
        return {
          ...state,
          player: updatedPlayer
        };
      } else if (playerId === state.npc.id) {
        const updatedNpc = { 
          ...state.npc,
          island: {
            ...state.npc.island,
            units: [...state.npc.island.units, ...units]
          }
        };
        
        return {
          ...state,
          npc: updatedNpc
        };
      }
      
      return state;
    });
  },
  
  // Birim yerleştirme fonksiyonu
  deployUnit: (playerId: string, unitId: string, position: {q: number, r: number, s: number}) => {
    set((state) => {
      if (playerId === state.player.id) {
        const unitIndex = state.player.island.units.findIndex((u: Unit) => u.id === unitId);
        
        if (unitIndex < 0) return state;
        
        const updatedUnits = [...state.player.island.units];
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          isDeployed: true,
          position
        };
        
        return {
          ...state,
          player: {
            ...state.player,
            island: {
              ...state.player.island,
              units: updatedUnits
            }
          }
        };
      } else if (playerId === state.npc.id) {
        const unitIndex = state.npc.island.units.findIndex((u: Unit) => u.id === unitId);
        
        if (unitIndex < 0) return state;
        
        const updatedUnits = [...state.npc.island.units];
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          isDeployed: true,
          position
        };
        
        return {
          ...state,
          npc: {
            ...state.npc,
            island: {
              ...state.npc.island,
              units: updatedUnits
            }
          }
        };
      }
      
      return state;
    });
  },
  
  // Birim yerini değiştirme fonksiyonu
  undeployUnit: (playerId: string, unitId: string) => {
    set((state) => {
      if (playerId === state.player.id) {
        const unitIndex = state.player.island.units.findIndex((u: Unit) => u.id === unitId);
        
        if (unitIndex < 0) return state;
        
        const updatedUnits = [...state.player.island.units];
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          isDeployed: false,
          position: undefined
        };
        
        return {
          ...state,
          player: {
            ...state.player,
            island: {
              ...state.player.island,
              units: updatedUnits
            }
          }
        };
      } else if (playerId === state.npc.id) {
        const unitIndex = state.npc.island.units.findIndex((u: Unit) => u.id === unitId);
        
        if (unitIndex < 0) return state;
        
        const updatedUnits = [...state.npc.island.units];
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          isDeployed: false,
          position: undefined
        };
        
        return {
          ...state,
          npc: {
            ...state.npc,
            island: {
              ...state.npc.island,
              units: updatedUnits
            }
          }
        };
      }
      
      return state;
    });
  },

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
      get().combineFeathers(npc.id, "green", 1);
      actions.push("combineFeathers");
    } else if (blue >= 3) {
      get().combineFeathers(npc.id, "blue", 1);
      actions.push("combineFeathers");
    } else if (orange >= 3) {
      get().combineFeathers(npc.id, "orange", 1);
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