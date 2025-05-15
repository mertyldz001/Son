// Oyun durumu ve türler

export type GamePhase = "menu" | "preparation" | "battle" | "gameOver";

export interface GameState {
  currentPhase: GamePhase;
  currentTurn: number;
  player: Player;
  npc: Player;
  preparationTimeLeft: number;
  currentEnemyWave: EnemyWave | null;
  lastBattleResult: BattleResult | null;
  actionLog: GameAction[];
  battleLog: BattleLog[];
  advancedMode: boolean; // Advanced mode
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  island: Island;
}

export interface Island {
  id: string;
  name: string;
  owner: string;
  resources: {
    gold: number;
    eggs: number;
  };
  buildings: Building[];
  army: Army;
  hatchery: HatcherySlot[];
  featherInventory: FeatherInventory;
  units: Unit[];
  gold: number; // İhtiyaç duyulursa doğrudan altın miktarı
}

export interface Unit {
  id: string;
  type: 'warrior' | 'soldier';
  health: number;
  attack: number;
  defense: number;
  speed: number;
  isDeployed: boolean;
  position?: {
    q: number;
    r: number;
    s: number;
  };
}

export interface Army {
  soldiers: number;
  health: number;
  attackPower: number;
  attackSpeed: number;
  bonuses: Bonuses;
}

export interface Bonuses {
  health: number;
  attackPower: number;
  attackSpeed: number;
}

export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  productionRate: number;
}

export type BuildingType = "barracks" | "mine" | "hatchery";

export interface HatcherySlot {
  id: string;
  isActive: boolean;
  egg: Egg | null;
}

export interface Egg {
  id: string;
  color: FeatherColor;
  bonusType: BonusType;
  bonusValue: number;
}

export type BonusType = "health" | "attackPower" | "attackSpeed";

export interface FeatherInventory {
  green: number;
  blue: number;
  orange: number;
}

export type FeatherColor = "green" | "blue" | "orange";

export interface Feather {
  id: string;
  color: FeatherColor;
}

export interface EnemyWave {
  id: string;
  level: number;
  units: Unit[];
  spawnRate: number;
}

export interface BattleResult {
  playerWon: boolean;
  playerDamage: number;
  enemiesDefeated: number;
  turnsElapsed: number;
}

export interface BattleLog {
  turn: number;
  actions: BattleAction[];
}

export interface BattleAction {
  actorId: string;
  targetId: string | null;
  type: "attack" | "defend" | "die";
  damage?: number;
}

export interface GameAction {
  playerId: string;
  type: ActionType;
  targetId?: string;
  amount?: number;
  description: string;
}

export type ActionType = 
  | "collectFeathers" 
  | "trainSoldiers" 
  | "upgradeBuilding"
  | "hatchEgg"
  | "activateEgg"
  | "gameStart"
  | "preparation"
  | "battle"
  | "gameOver";