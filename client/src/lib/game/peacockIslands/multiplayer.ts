import { Player, Unit, BattleResult } from "./types";

/**
 * İki oyuncu arasındaki savaşı simüle eder
 */
export const simulatePlayerBattle = (
  player1: Player,
  player2: Player
): BattleResult => {
  // Hazırlanan askerler
  const player1Units = player1.island.units.filter(unit => unit.isDeployed);
  const player2Units = player2.island.units.filter(unit => unit.isDeployed);
  
  // Asker yoksa sonucu hemen belirle
  if (player1Units.length === 0) {
    return {
      playerVictory: false,
      enemiesDefeated: 0,
      playerUnitsLost: 0,
      feathersCollected: {
        green: 0,
        blue: 0,
        orange: 0
      },
      battleLog: [{
        message: "Savaş hazırlığında asker yerleştirmediniz.",
        timestamp: new Date().toISOString()
      }]
    };
  }
  
  if (player2Units.length === 0) {
    return {
      playerVictory: true,
      enemiesDefeated: 0,
      playerUnitsLost: 0,
      feathersCollected: {
        green: 0,
        blue: 0,
        orange: 0
      },
      battleLog: [{
        message: "Rakibiniz savaş hazırlığında asker yerleştirmedi.",
        timestamp: new Date().toISOString()
      }]
    };
  }
  
  // Basit bir savaş simülasyonu
  // Her askerin gücünü hesapla
  const calculateUnitPower = (unit: Unit): number => {
    return unit.attack + unit.defense + unit.health + unit.speed;
  };
  
  // Toplam ordu gücünü hesapla
  const player1Power = player1Units.reduce((total, unit) => total + calculateUnitPower(unit), 0);
  const player2Power = player2Units.reduce((total, unit) => total + calculateUnitPower(unit), 0);
  
  // Şans faktörü ekle (%20 şans faktörü)
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 ile 1.2 arası
  const adjustedPlayer1Power = player1Power * randomFactor;
  
  // Savaş sonucunu belirle
  const player1Victory = adjustedPlayer1Power > player2Power;
  
  // Kaybedilen ve yenilen birim sayılarını hesapla (basitleştirilmiş)
  const powerRatio = player1Victory 
    ? adjustedPlayer1Power / player2Power 
    : player2Power / adjustedPlayer1Power;
  
  const strongerUnits = player1Victory ? player1Units : player2Units;
  const weakerUnits = player1Victory ? player2Units : player1Units;
  
  // Kaybedilen birim sayısı (daha güçlü taraf daha az birim kaybeder)
  const strongerLosses = Math.floor(strongerUnits.length * (0.3 / powerRatio));
  // Yenilen birim sayısı (daha zayıf taraf daha fazla birim kaybeder)
  const weakerLosses = Math.floor(weakerUnits.length * 0.7);
  
  // Savaş logu oluştur
  const battleLog = [
    {
      message: `Savaş başladı: ${player1.name} vs ${player2.name}`,
      timestamp: new Date().toISOString()
    },
    {
      message: player1Victory 
        ? `${player1.name} savaşı kazandı!` 
        : `${player2.name} savaşı kazandı!`,
      timestamp: new Date().toISOString()
    }
  ];
  
  return {
    playerVictory: player1Victory,
    enemyUnitsDefeated: player1Victory ? weakerLosses : strongerLosses,
    playerUnitsLost: player1Victory ? strongerLosses : weakerLosses,
    feathersCollected: {
      green: 0,
      blue: 0, 
      orange: 0
    }, // İki oyuncu arasında savaşta tüy kazanımı yok
    battleLog: battleLog
  };
};

/**
 * İki oyuncu arasındaki detaylı savaş simülasyonu
 * Her tur için saldırı/savunma işlemlerini adım adım gerçekleştirir
 */
export const simulateDetailedBattle = (
  player1Units: Unit[],
  player2Units: Unit[]
): {
  log: string[];
  player1Remaining: Unit[];
  player2Remaining: Unit[];
  winner: 1 | 2 | 0; // 1: Player 1 kazandı, 2: Player 2 kazandı, 0: Berabere
} => {
  // Birimlerin kopyasını oluştur (referans değiştirmeden)
  const p1Units = [...player1Units].map(unit => ({...unit}));
  const p2Units = [...player2Units].map(unit => ({...unit}));
  
  const battleLog: string[] = [`Savaş başladı: ${p1Units.length} asker vs ${p2Units.length} asker`];
  let currentTurn = 0;
  
  // Maksimum tur sayısı
  const MAX_TURNS = 20;
  
  // Her iki tarafta da asker kalana kadar savaşı sürdür
  while (p1Units.length > 0 && p2Units.length > 0 && currentTurn < MAX_TURNS) {
    currentTurn++;
    
    // Player 1 saldırısı
    if (p1Units.length > 0 && p2Units.length > 0) {
      const attacker = p1Units[Math.floor(Math.random() * p1Units.length)];
      const defender = p2Units[Math.floor(Math.random() * p2Units.length)];
      
      // Saldırı gücü ve savunma hesapla
      const attackPower = Math.max(1, attacker.attack - defender.defense/2);
      
      // Hasarı uygula
      defender.health -= attackPower;
      
      battleLog.push(`${attacker.id} → ${defender.id}: ${attackPower} hasar! (${Math.max(0, defender.health)} HP kaldı)`);
      
      // Savunan öldüyse kaldır
      if (defender.health <= 0) {
        p2Units.splice(p2Units.indexOf(defender), 1);
        battleLog.push(`${defender.id} savaş dışı kaldı!`);
      }
    }
    
    // Player 2 saldırısı
    if (p1Units.length > 0 && p2Units.length > 0) {
      const attacker = p2Units[Math.floor(Math.random() * p2Units.length)];
      const defender = p1Units[Math.floor(Math.random() * p1Units.length)];
      
      // Saldırı gücü ve savunma hesapla
      const attackPower = Math.max(1, attacker.attack - defender.defense/2);
      
      // Hasarı uygula
      defender.health -= attackPower;
      
      battleLog.push(`${attacker.id} → ${defender.id}: ${attackPower} hasar! (${Math.max(0, defender.health)} HP kaldı)`);
      
      // Savunan öldüyse kaldır
      if (defender.health <= 0) {
        p1Units.splice(p1Units.indexOf(defender), 1);
        battleLog.push(`${defender.id} savaş dışı kaldı!`);
      }
    }
  }
  
  // Savaş sonucu
  let winner: 1 | 2 | 0;
  
  if (p1Units.length > p2Units.length) {
    winner = 1;
    battleLog.push(`Player 1 savaşı kazandı! (${p1Units.length} asker hayatta kaldı)`);
  } else if (p2Units.length > p1Units.length) {
    winner = 2;
    battleLog.push(`Player 2 savaşı kazandı! (${p2Units.length} asker hayatta kaldı)`);
  } else {
    winner = 0;
    battleLog.push(`Savaş berabere bitti.`);
  }
  
  return {
    log: battleLog,
    player1Remaining: p1Units,
    player2Remaining: p2Units,
    winner
  };
};