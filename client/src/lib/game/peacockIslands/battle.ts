// Savaş mekanikleri için fonksiyonlar
import { nanoid } from "nanoid";
import { 
  Army, 
  EnemyWave, 
  BattleResult, 
  FeatherInventory, 
  FeatherColor 
} from "./types";

// Savaş hesaplamaları için sabitler
const SOLDIER_BASE_HEALTH = 30;
const SOLDIER_BASE_ATTACK = 10;

/**
 * Askerlerin toplam can ve saldırı gücünü hesapla
 */
export const calculateArmyStats = (army: Army): { totalHealth: number, totalAttackPower: number } => {
  // Her askerin katkısını hesapla
  const baseSoldierHealth = SOLDIER_BASE_HEALTH + army.bonuses.health;
  const baseSoldierAttack = SOLDIER_BASE_ATTACK + army.bonuses.attackPower;
  
  // Saldırı hızı bonusu saldırı gücüne dönüştürülüyor
  const attackSpeedMultiplier = 1 + (army.bonuses.attackSpeed / 100);
  
  const totalHealth = army.soldiers * baseSoldierHealth;
  const totalAttackPower = Math.floor(army.soldiers * baseSoldierAttack * attackSpeedMultiplier);
  
  return { totalHealth, totalAttackPower };
};

/**
 * Rastgele tüy rengi seç
 */
export const getRandomFeatherColor = (): FeatherColor => {
  const colors: FeatherColor[] = ["green", "blue", "orange"];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

/**
 * Yenilen düşmanlardan tüy elde et
 */
export const collectFeathersFromEnemies = (enemiesDefeated: number): FeatherInventory => {
  const feathers: FeatherInventory = {
    green: 0,
    blue: 0,
    orange: 0
  };
  
  // Her düşmandan rastgele bir tüy düşür
  for (let i = 0; i < enemiesDefeated; i++) {
    const featherColor = getRandomFeatherColor();
    feathers[featherColor]++;
  }
  
  return feathers;
};

/**
 * Savaş simülasyonu
 */
export const simulateBattle = (army: Army, enemyWave: EnemyWave): BattleResult => {
  // Ordu istatistiklerini hesapla
  const { totalHealth, totalAttackPower } = calculateArmyStats(army);
  
  // Düşmanlar için hesaplama
  const enemyHealth = enemyWave.totalHealth;
  const enemyAttack = enemyWave.totalAttackPower;
  
  // Askerlerin yapacağı toplam hasar
  const damageToEnemies = totalAttackPower;
  
  // Düşmanların yapacağı toplam hasar
  const damageToPlayer = enemyAttack;
  
  // Düşmanlar yenildi mi?
  const enemiesDefeated = damageToEnemies >= enemyHealth ? 
      enemyWave.enemies.length : 
      Math.floor((damageToEnemies / enemyHealth) * enemyWave.enemies.length);
  
  // Oyuncuya gelen hasar
  const playerDamage = Math.max(0, damageToPlayer - totalHealth);
  
  // Tüy elde etme
  const feathersCollected = collectFeathersFromEnemies(enemiesDefeated);
  
  // Kalan oyuncu sağlığı
  const remainingPlayerHealth = Math.max(0, totalHealth - damageToPlayer);
  
  // Zafer kontrolü
  const playerVictory = damageToEnemies >= enemyHealth;
  
  return {
    playerVictory,
    enemiesDefeated,
    feathersCollected,
    playerDamage,
    remainingPlayerHealth
  };
};

/**
 * Yumurta türüne göre bonus değeri
 */
export const getEggBonusValue = (color: FeatherColor): { bonusType: string, bonusValue: number } => {
  switch(color) {
    case "green":
      return { bonusType: "health", bonusValue: 20 };
    case "blue":
      return { bonusType: "attackSpeed", bonusValue: 20 };
    case "orange":
      return { bonusType: "attackPower", bonusValue: 20 };
    default:
      return { bonusType: "health", bonusValue: 10 };
  }
};

/**
 * Tüy rengi için Türkçe ad
 */
export const getFeatherColorName = (color: FeatherColor): string => {
  switch(color) {
    case "green": return "Yeşil";
    case "blue": return "Mavi";
    case "orange": return "Turuncu";
    default: return "Bilinmeyen";
  }
};

/**
 * Bonus türü için Türkçe ad
 */
export const getBonusTypeName = (bonusType: string): string => {
  switch(bonusType) {
    case "health": return "Can";
    case "attackSpeed": return "Saldırı Hızı";
    case "attackPower": return "Saldırı Gücü";
    default: return "Bilinmeyen";
  }
};