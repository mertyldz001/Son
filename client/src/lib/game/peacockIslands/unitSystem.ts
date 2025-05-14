import { nanoid } from "nanoid";
import { Unit, UnitType } from "../peacockIslands/types";

/**
 * Yeni bir birim oluşturur
 */
export const createUnit = (type: UnitType, playerId: string): Unit => {
  // Birim tipi ve oyuncuya göre özellikleri ayarla
  const stats = type === "warrior" 
    ? { health: 45, attackPower: 15, attackSpeed: 1.3 } // Tavus askeri
    : { health: 35, attackPower: 20, attackSpeed: 1.0 }; // İnsan askeri
    
  return {
    id: nanoid(),
    type,
    playerId,
    health: stats.health,
    attackPower: stats.attackPower,
    attackSpeed: stats.attackSpeed,
    isDeployed: false
  };
};

/**
 * Birimleri hex koordinatlarda göstermek için konumlarını haritaya dönüştürür
 */
export const getDeployedUnitPositionsMap = (units: Unit[]) => {
  const positionMap = new Map<string, Unit>();
  
  // Yerleştirilmiş birimleri haritaya ekle
  units
    .filter(unit => unit.isDeployed && unit.position)
    .forEach(unit => {
      const key = `${unit.position!.q},${unit.position!.r},${unit.position!.s}`;
      positionMap.set(key, unit);
    });
    
  return positionMap;
};

/**
 * Birimlere bonus uygula
 */
export const applyBonusesToUnits = (
  units: Unit[], 
  healthBonus: number = 0, 
  attackBonus: number = 0, 
  speedBonus: number = 0
): Unit[] => {
  return units.map(unit => ({
    ...unit,
    health: unit.health + healthBonus,
    attackPower: unit.attackPower + attackBonus,
    attackSpeed: unit.attackSpeed * (1 + speedBonus)
  }));
};