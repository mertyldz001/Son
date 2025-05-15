// Oyun içi birim türleri
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

// Tüy türleri
export type FeatherColor = 'green' | 'blue' | 'orange';

// Yumurta arayüzü
export interface Egg {
  id: string;
  color: FeatherColor;
  hatchTime: number;
  ready: boolean;
}

// Kuluçka slotu arayüzü
export interface HatcherySlot {
  id: string;
  isActive: boolean;
  egg: Egg | null;
  status?: 'idle' | 'hatching' | 'ready';
}