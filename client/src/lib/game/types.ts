export type GamePhase = "menu" | "playing" | "enemyTurn" | "gameOver";

export interface HexCoordinates {
  q: number; // Column
  r: number; // Row
  s: number; // Third coordinate (q + r + s = 0)
}

export type CardRarity = "common" | "rare" | "epic" | "legendary";
export type CardClass = "warrior" | "mage" | "rogue";

export interface CardType {
  id: string;
  name: string;
  class: CardClass;
  attack: number;
  health: number;
  rarity: CardRarity;
  owner: "player" | "enemy";
  position: HexCoordinates;
  isAttacking: boolean;
}

export type DragState = {
  isDragging: boolean;
  draggedCard: CardType | null;
  dragPosition: [number, number, number];
};
