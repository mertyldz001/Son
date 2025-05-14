// Düşman oluşturma ve yönetim fonksiyonları
import { nanoid } from "nanoid";
import { 
  PeacockEnemy, 
  PeacockEnemyType, 
  EnemyWave 
} from "./types";

// Düşman özellikleri için temel değerler
const BASE_HEALTH = 50;
const BASE_ATTACK = 10;
const LEVEL_HEALTH_SCALING = 20; // Her seviye için ek can
const LEVEL_ATTACK_SCALING = 5;  // Her seviye için ek saldırı gücü

// Düşman türleri ve seviye aralıkları
const ENEMY_TYPES: { type: PeacockEnemyType, minLevel: number, healthMultiplier: number, attackMultiplier: number }[] = [
  { type: "chick", minLevel: 1, healthMultiplier: 0.8, attackMultiplier: 0.5 },
  { type: "juvenile", minLevel: 3, healthMultiplier: 1.0, attackMultiplier: 1.0 },
  { type: "adult", minLevel: 5, healthMultiplier: 1.5, attackMultiplier: 1.3 },
  { type: "alpha", minLevel: 8, healthMultiplier: 2.0, attackMultiplier: 1.8 }
];

/**
 * Düşman türünü seviyeye göre belirle
 */
export const getEnemyTypeByLevel = (level: number): PeacockEnemyType => {
  // Düşman türleri içinde seviyeye uygun en güçlü türü bul
  const eligibleTypes = ENEMY_TYPES.filter(e => e.minLevel <= level);
  const highestType = eligibleTypes[eligibleTypes.length - 1];
  return highestType.type;
};

/**
 * Düşman Oluştur
 */
export const createEnemy = (level: number, waveLevel: number): PeacockEnemy => {
  const enemyType = getEnemyTypeByLevel(waveLevel);
  const typeData = ENEMY_TYPES.find(e => e.type === enemyType)!;
  
  // Seviyeye ve türe göre can ve saldırı gücü hesapla
  const health = Math.round(
    (BASE_HEALTH + (level * LEVEL_HEALTH_SCALING)) * typeData.healthMultiplier
  );
  
  const attackPower = Math.round(
    (BASE_ATTACK + (level * LEVEL_ATTACK_SCALING)) * typeData.attackMultiplier
  );
  
  return {
    id: nanoid(),
    level,
    health,
    attackPower,
    type: enemyType
  };
};

/**
 * Dalga zorluk seviyesini hesapla
 */
export const calculateWaveDifficulty = (waveLevel: number): number => {
  // Her dalga, oyuncunun biraz daha zorlansın diye artan sayıda düşman olacak
  const baseEnemyCount = 2;
  const additionalEnemies = Math.floor(waveLevel / 3);
  return baseEnemyCount + additionalEnemies;
};

/**
 * Düşman dalgası oluştur
 */
export const createEnemyWave = (waveLevel: number): EnemyWave => {
  const enemyCount = calculateWaveDifficulty(waveLevel);
  const enemies: PeacockEnemy[] = [];
  
  // Düşman seviyelerini hesapla
  for (let i = 0; i < enemyCount; i++) {
    // Ana düşmanlar biraz daha güçlü olsun
    const enemyLevel = i === 0 ? waveLevel + 1 : waveLevel;
    const enemy = createEnemy(enemyLevel, waveLevel);
    enemies.push(enemy);
  }
  
  // Toplam can ve saldırı gücünü hesapla
  const totalHealth = enemies.reduce((sum, enemy) => sum + enemy.health, 0);
  const totalAttackPower = enemies.reduce((sum, enemy) => sum + enemy.attackPower, 0);
  
  return {
    id: nanoid(),
    level: waveLevel,
    enemies,
    totalHealth,
    totalAttackPower,
    defeated: false
  };
};

/**
 * Düşman türü için Türkçe ad
 */
export const getEnemyTypeName = (type: PeacockEnemyType): string => {
  switch(type) {
    case "chick": return "Tavus Kuşu Yavrusu";
    case "juvenile": return "Genç Tavus Kuşu";
    case "adult": return "Yetişkin Tavus Kuşu";
    case "alpha": return "Alfa Tavus Kuşu";
    default: return "Bilinmeyen Tavus Kuşu";
  }
};

/**
 * Düşman türü için açıklama
 */
export const getEnemyTypeDescription = (type: PeacockEnemyType): string => {
  switch(type) {
    case "chick": 
      return "Zayıf ama sayıca fazla olabilirler.";
    case "juvenile": 
      return "Dengeli saldırı ve savunma özellikleri.";
    case "adult": 
      return "Güçlü ve dayanıklı düşmanlar.";
    case "alpha": 
      return "Son derece tehlikeli ve güçlü lider düşmanlar.";
    default: 
      return "Özellikleri bilinmiyor.";
  }
};