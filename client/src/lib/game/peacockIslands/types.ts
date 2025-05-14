// Oyun fazlarını tanımlayan tip
export type GamePhase = "menu" | "preparation" | "battle" | "gameOver";

// Oyun durumu
export interface GameState {
  currentPhase: GamePhase;
  currentTurn: number;
  player: Player;
  npc: Player;
  preparationTimeLeft: number;
  currentEnemyWave: EnemyWave | null;
  lastBattleResult: BattleResult | null;
  actionLog: string[]; // Oyuncuya gösterilecek aksiyon günlüğü
  battleLog: string[]; // Savaş kayıtları
}

// Oyuncu tipi
export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  island: Island;
}

// Ada tipi
export interface Island {
  id: string;
  name: string;
  owner: string; // Oyuncu ID'si
  resources: Resources;
  buildings: Building[];
  army: Army;
  hatchery: HatcherySlot[]; // Kuluçka yuvaları
  featherInventory: FeatherInventory; // Tüy envanteri
  units: Unit[]; // Asker ve savaşçı birimleri
  gold: number; // Altın miktarı
}

// Birim tipi
export interface Unit {
  id: string;
  type: UnitType;
  playerId: string; // Birime sahip olan oyuncu ID'si
  health: number;
  attackPower: number;
  attackSpeed: number;
  position?: { q: number, r: number, s: number }; // Hexagonal grid pozisyonu
  isDeployed: boolean; // Savaş alanına yerleştirildi mi?
}

// Birim tipleri
export type UnitType = "warrior" | "soldier";

// Kaynaklar
export interface Resources {
  gold: number;
  eggs: number; // Toplam yumurta sayısı
}

// Tüy renkleri
export type FeatherColor = "green" | "blue" | "orange";

// Tüy envanteri
export interface FeatherInventory {
  green: number;
  blue: number;
  orange: number;
}

// Tüy tipi
export interface Feather {
  id: string;
  color: FeatherColor;
}

// Yumurta tipi
export interface Egg {
  id: string;
  color: FeatherColor;
  bonusType: BonusType;
  bonusValue: number;
}

// Bonus tipleri
export type BonusType = "health" | "attackSpeed" | "attackPower";

// Kuluçka yuvası
export interface HatcherySlot {
  id: string;
  egg: Egg | null;
  isActive: boolean;
  status: "empty" | "incubating" | "ready"; // Durumu
}

// Bina tipi
export type BuildingType = "barracks" | "mine" | "hatchery";

// Bina
export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  productionRate: number;
}

// Ordu
export interface Army {
  soldiers: number;
  health: number; // Toplam can
  attackPower: number; // Toplam saldırı gücü
  attackSpeed: number; // Toplam saldırı hızı (%)
  bonuses: {
    health: number;
    attackPower: number;
    attackSpeed: number;
  };
}

// Tavus Kuşu Düşman tipi
export interface PeacockEnemy {
  id: string;
  level: number;
  health: number;
  attackPower: number;
  type: PeacockEnemyType;
}

// Düşman türleri
export type PeacockEnemyType = "chick" | "juvenile" | "adult" | "alpha";

// Düşman dalgası
export interface EnemyWave {
  id: string;
  level: number;
  enemies: PeacockEnemy[];
  totalHealth: number;
  totalAttackPower: number;
  defeated: boolean;
}

// Savaş Sonucu
export interface BattleResult {
  playerVictory: boolean;
  enemiesDefeated: number;
  feathersCollected: FeatherInventory;
  playerDamage: number;
  remainingPlayerHealth: number;
}

// Oyun durumu
export interface GameState {
  currentPhase: GamePhase;
  currentTurn: number;
  player: Player;
  npc: Player;
  preparationTimeLeft: number; // Saniye cinsinden
  currentEnemyWave: EnemyWave | null;
  lastBattleResult: BattleResult | null; 
}

// İşlem tipleri
export type ActionType = 
  | "collectFeathers" 
  | "trainSoldiers" 
  | "upgradeBuilding" 
  | "combineFeathers" 
  | "hatchEgg"
  | "activateEgg";

// İşlem
export interface GameAction {
  type: ActionType;
  payload?: any; // Her işlem için farklı payload'lar olabilir
}