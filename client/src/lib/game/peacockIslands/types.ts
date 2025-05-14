// Oyun fazlarını tanımlayan tip
export type GamePhase = "menu" | "preparation" | "battle" | "gameOver";

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
}

// Kaynaklar
export interface Resources {
  gold: number;
  feathers: number;
  eggs: number;
}

// Tüy renkleri
export type FeatherColor = "red" | "blue" | "green" | "purple" | "gold";

// Tüy tipi
export interface Feather {
  id: string;
  color: FeatherColor;
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
  power: number;
}

// Düşman dalgası
export interface EnemyWave {
  id: string;
  level: number;
  power: number;
  defeated: boolean;
}

// Oyun durumu
export interface GameState {
  currentPhase: GamePhase;
  currentTurn: number;
  player: Player;
  npc: Player;
  preparationTimeLeft: number; // Saniye cinsinden
  currentEnemyWave: EnemyWave | null;
}

// İşlem tipleri
export type ActionType = 
  | "collectFeathers" 
  | "trainSoldiers" 
  | "upgradeBuilding" 
  | "combineFeathers" 
  | "hatchEgg";

// İşlem
export interface GameAction {
  type: ActionType;
  payload?: any; // Her işlem için farklı payload'lar olabilir
}