import { usePeacockIslandsStore } from "./usePeacockIslandsStore";
import { createUnit, applyBonusesToUnits } from "../game/peacockIslands/unitSystem";

// Zustand mağazasına deployUnit ve undeployUnit fonksiyonlarını ekle
const addDeployUnitFunctions = () => {
  // Mevcut mağaza değerlerini al
  const store = usePeacockIslandsStore.getState();
  
  // Mağazayı fonksiyonlarla güncelle
  usePeacockIslandsStore.setState({
    ...store,
    
    // Birim yerleştirme fonksiyonu
    deployUnit: (playerId: string, unitId: string, position: {q: number, r: number, s: number}) => {
      usePeacockIslandsStore.setState(state => {
        // Hangi oyuncunun birimini yerleştireceğiz?
        const isPlayer = playerId === state.player.id;
        const player = isPlayer ? state.player : state.npc;
        
        // Birimleri klonla
        const updatedUnits = [...player.island.units];
        
        // Birimi bul
        const unitIndex = updatedUnits.findIndex(unit => unit.id === unitId);
        if (unitIndex === -1) return state;
        
        // Birimin pozisyonunu güncelle
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          position,
          isDeployed: true
        };
        
        // State'i güncelle
        if (isPlayer) {
          return {
            ...state,
            player: {
              ...state.player,
              island: {
                ...state.player.island,
                units: updatedUnits
              }
            },
            actionLog: [...state.actionLog, `${updatedUnits[unitIndex].type === 'warrior' ? 'Tavus Askeri' : 'İnsan Askeri'} savaş alanına yerleştirildi!`]
          };
        } else {
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
      });
    },
    
    // Birim kaldırma fonksiyonu
    undeployUnit: (playerId: string, unitId: string) => {
      usePeacockIslandsStore.setState(state => {
        // Hangi oyuncunun birimini kaldıracağız?
        const isPlayer = playerId === state.player.id;
        const player = isPlayer ? state.player : state.npc;
        
        // Birimleri klonla
        const updatedUnits = [...player.island.units];
        
        // Birimi bul
        const unitIndex = updatedUnits.findIndex(unit => unit.id === unitId);
        if (unitIndex === -1) return state;
        
        // Birimin konumunu temizle
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          position: undefined,
          isDeployed: false
        };
        
        // State'i güncelle
        if (isPlayer) {
          return {
            ...state,
            player: {
              ...state.player,
              island: {
                ...state.player.island,
                units: updatedUnits
              }
            },
            actionLog: [...state.actionLog, `${updatedUnits[unitIndex].type === 'warrior' ? 'Tavus Askeri' : 'İnsan Askeri'} savaş alanından çıkarıldı!`]
          };
        } else {
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
      });
    },
    
    // Asker eğitme fonksiyonunu güncelle (birimler eklensin)
    trainSoldiers: (playerId: string, amount: number) => {
      usePeacockIslandsStore.setState(state => {
        const isPlayer = playerId === state.player.id;
        const player = isPlayer ? state.player : state.npc;
        const goldCost = amount * 5; // Her asker 5 altın
        
        // Yeterli altın kontrolü
        if (player.island.gold < goldCost) return state;
        
        // Yeni askerler oluştur
        const newUnits = Array(amount)
          .fill(null)
          .map(() => createUnit(Math.random() > 0.5 ? "warrior" : "soldier", playerId));
        
        // State'i güncelle
        if (isPlayer) {
          return {
            ...state,
            player: {
              ...state.player,
              island: {
                ...state.player.island,
                gold: state.player.island.gold - goldCost,
                units: [...state.player.island.units, ...newUnits]
              }
            },
            actionLog: [...state.actionLog, `${amount} yeni asker eğitildi!`]
          };
        } else {
          return {
            ...state,
            npc: {
              ...state.npc,
              island: {
                ...state.npc.island,
                gold: state.npc.island.gold - goldCost,
                units: [...state.npc.island.units, ...newUnits]
              }
            }
          };
        }
      });
    }
  });
};

// Fonksiyonları ekle
addDeployUnitFunctions();

export default usePeacockIslandsStore;