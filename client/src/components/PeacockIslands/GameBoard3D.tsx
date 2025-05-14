import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  useTexture, 
  Sky, 
  Environment, 
  Sparkles,
  Cloud,
  Float,
  MeshDistortMaterial,
  PresentationControls,
  KeyboardControls
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';
import { PenguinAvatar } from './PenguinAvatar';

// Animasyonlu su yüzeyi bileşeni
const AnimatedWater = ({ position = [0, 0, 0], size = 20 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [time, setTime] = useState(0);
  
  useFrame((_, delta) => {
    setTime(prev => prev + delta * 0.3);
    
    if (meshRef.current) {
      // Hafif dalgalanma efekti
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      position={[position[0], position[1], position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size, 32, 32]} />
      <MeshDistortMaterial
        color="#4488aa"
        transparent
        opacity={0.7}
        distort={0.3} // dalgalanma miktarı
        speed={1.5} // dalgalanma hızı
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
};

// Hex harita oluşturucu yardımcı fonksiyonlar
const createHexPosition = (q: number, r: number, size: number = 1) => {
  // Hex koordinatlarını 3D koordinatlara dönüştür
  const x = size * (3/2 * q);
  const z = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return [x, 0, z];
};

// Altıgen savaş meydanı hücresi - TFT stilinde
const BattleHex = ({ position, color, isHighlighted, isPlayerSide, isOccupied = false }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);
  
  // Hover efektini yönet
  useFrame((_, delta) => {
    if (!meshRef.current || !lineRef.current) return;
    
    // Hover durumuna göre yükseklik ayarla
    const targetY = hovered || isHighlighted ? 0.05 : 0;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 5 * delta;
    lineRef.current.position.y = meshRef.current.position.y + 0.02; // Çizgileri yukarıda tut
    
    // Renk değişimini yönet
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const lineMaterial = lineRef.current.material as THREE.LineBasicMaterial;
    
    // Altıgen rengi - TFT stili
    const targetColor = new THREE.Color(
      isHighlighted ? '#4488ff' : 
      hovered ? '#44aa44' : 
      isOccupied ? color : // Eğer dolu ise belirgin renk
      new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.7) // Boş ise soldurulmuş renk
    );
    material.color.lerp(targetColor, 10 * delta);
    
    // Kenar çizgisi görünürlüğü
    const targetOpacity = hovered || isHighlighted || isOccupied ? 1.0 : 0.3;
    lineMaterial.opacity += (targetOpacity - lineMaterial.opacity) * 10 * delta;
    
    // Şeffaflık ayarı - TFT'deki gibi boş altıgenler hafif görünür
    const targetAlpha = hovered || isHighlighted || isOccupied ? 0.9 : 0.15;
    material.opacity += (targetAlpha - material.opacity) * 10 * delta;
  });
  
  // Altıgen şeklini oluştur
  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 0.5; // Altıgen boyutu
    
    // Altıgen şekli oluştur
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    
    return shape;
  }, []);
  
  // Altıgen kenarları için geometri oluştur
  const hexEdges = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const size = 0.5;
    
    // Altıgen kenar noktalarını oluştur
    for (let i = 0; i <= 6; i++) {
      const angle = (Math.PI / 3) * (i % 6);
      const x = size * Math.cos(angle);
      const z = size * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);
  
  return (
    <group position={position}>
      {/* Altıgen dolgusu */}
      <mesh 
        ref={meshRef}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]} // Yatay pozisyonda
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <extrudeGeometry 
          args={[
            hexShape,
            {
              depth: 0.08,
              bevelEnabled: true,
              bevelSegments: 1,
              bevelSize: 0.01,
              bevelThickness: 0.01
            }
          ]} 
        />
        <meshStandardMaterial 
          color={color} 
          roughness={0.7}
          metalness={0.2}
          transparent={true}
          opacity={isOccupied ? 0.9 : 0.15}
        />
      </mesh>
      
      {/* Altıgen kenar çizgileri */}
      <lineSegments ref={lineRef}>
        <primitive object={hexEdges} />
        <lineBasicMaterial 
          color={isPlayerSide ? "#99ffaa" : "#ffaa99"} 
          transparent={true} 
          opacity={isOccupied ? 1.0 : 0.3}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
};

// Birim taşı (karakter)
const UnitPiece = ({ position, color, power, health, type, size = 0.4 }: any) => {
  // Karakter pozisyonu - hexin üzerinde biraz yukarıda durmalı
  const adjustedPosition: [number, number, number] = [
    position[0], 
    position[1] + 0.3, 
    position[2]
  ];
  
  const meshRef = useRef<THREE.Group>(null);
  
  // Hafif sallanma animasyonu
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = adjustedPosition[1] + Math.sin(Date.now() * 0.003) * 0.05;
    meshRef.current.rotation.y += delta * 0.3; // Yavaşça dön
  });
  
  // Tavus kuşu düşman birimi mi belirle
  const isPeacock = type === "chick" || type === "juvenile" || type === "adult" || type === "alpha";
  
  // Model ölçeği hesapla
  let modelScale = size;
  if (isPeacock) {
    switch (type) {
      case "chick": modelScale *= 0.8; break;
      case "juvenile": modelScale *= 1.0; break;
      case "adult": modelScale *= 1.2; break;
      case "alpha": modelScale *= 1.5; break;
    }
  }
  
  return (
    <group ref={meshRef} position={adjustedPosition}>
      <Suspense fallback={
        <>
          {/* Fallback basit geometriler */}
          {isPeacock ? (
            <group>
              {/* Tavus kuşu gövdesi */}
              <mesh castShadow position={[0, 0, 0]}>
                <sphereGeometry args={[size * 0.8, 16, 16]} />
                <meshStandardMaterial color={color} roughness={0.5} />
              </mesh>
              
              {/* Tavus kuşu kafası */}
              <mesh castShadow position={[0, size * 0.4, size * 0.6]}>
                <sphereGeometry args={[size * 0.4, 16, 16]} />
                <meshStandardMaterial color={color} roughness={0.5} />
              </mesh>
              
              {/* Tavus kuşu kuyruğu */}
              <mesh castShadow position={[0, size * 0.5, -size * 0.6]} rotation={[Math.PI * 0.2, 0, 0]}>
                <coneGeometry args={[size * 0.6, size * 1.2, 8]} />
                <meshStandardMaterial color={color} roughness={0.5} />
              </mesh>
            </group>
          ) : (
            // Normal asker birimi
            <mesh castShadow>
              <boxGeometry args={[size, size * 1.5, size]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          )}
        </>
      }>
        {/* 3D modeller */}
        {isPeacock ? (
          <PeacockWarriorModel 
            position={[0, -0.2, 0]} 
            scale={modelScale * 1.0} 
            type={type as any}
          />
        ) : (
          <HumanSoldierModel 
            position={[0, -0.2, 0]} 
            scale={modelScale * 0.8}
          />
        )}
      </Suspense>
      
      {/* Güç göstergesi */}
      <Text
        position={[0, size + 0.3, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {`${power}${health ? `/${health}` : ''}`}
      </Text>
    </group>
  );
};

// Ada temsili
const Island = ({ position, isPlayerIsland = false }: any) => {
  // Ada için renkler
  const islandColors = isPlayerIsland ? 
    { 
      base: "#88aa99", 
      terrain: "#76a288", 
      buildings: "#d5b981", 
      trees: "#33aa33",
      roofs: "#8b4513"
    } : 
    { 
      base: "#aa8899", 
      terrain: "#b38598", 
      buildings: "#a48871", 
      trees: "#aa3333",
      roofs: "#553322"
    };
  
  // Ada süsleme faktörü - kenarlar boyunca
  const decorationCount = 12;  // Daha fazla süs ekle
    
  return (
    <group position={position}>
      {/* Deniz altı bazı */}
      <mesh 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5.5, 6.5, 0.5, 8]} />
        <meshStandardMaterial 
          color="#336677" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ana ada platformu */}
      <mesh 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5.5, 0.8, 8]} />
        <meshStandardMaterial 
          color={islandColors.base} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* İkinci seviye toprak katmanı */}
      <mesh 
        position={[0, 0.1, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[4, 4.5, 0.4, 8]} />
        <meshStandardMaterial 
          color={islandColors.terrain} 
          roughness={0.9}
        />
      </mesh>
      
      {/* Merkez bina - Ada kenarına taşındı */}
      <group position={[3.5, 0.5, 0]}>
        {/* Temel */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.6, 1.2]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
        </mesh>
        
        {/* Kule 1 */}
        <mesh position={[-0.4, 0.8, -0.4]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.0, 8]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.7} />
        </mesh>
        
        {/* Kule 1 Çatısı */}
        <mesh position={[-0.4, 1.3, -0.4]} castShadow>
          <coneGeometry args={[0.3, 0.4, 8]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
        
        {/* Ana bina çatısı */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.0, 0.5, 1.0]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
      </group>
      
      {/* İkinci bina, karşı tarafa */}
      <group position={[-3.2, 0.5, -1.0]}>
        {/* Temel */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.6, 1.0]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
        </mesh>
        
        {/* Çatı - piramit şeklinde */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <coneGeometry args={[0.7, 0.8, 4]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Savaş alanını belirginleştiren mermer düzlem - ortadaki alanı belirtmek için */}
      <mesh 
        position={[0, 0.25, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial 
          color={isPlayerIsland ? "#9bb5a5" : "#b59b9b"}
          roughness={0.7}
          metalness={0.1}
          transparent={true}
          opacity={0.6}
        />
      </mesh>
      
      {/* Ortadaki savaş alanının sınırlarını belirten taşlar */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (Math.PI / 2) * i;
        const x = Math.cos(angle) * 3;
        const z = Math.sin(angle) * 3;
        
        return (
          <group key={`corner-${i}`} position={[x, 0.3, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color="#aaaaaa" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      
      {/* Ada süslemeleri - Sadece kenarlar boyunca dizilmiş */}
      {Array.from({ length: decorationCount }).map((_, i) => {
        const angle = (Math.PI * 2 / decorationCount) * i;
        const radius = 4; // Adanın en dış çevresine yerleştir
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Dekorasyon türünü belirle: ağaç, bina veya kaya
        const decorationType = i % 3; // 0: ağaç, 1: bina, 2: kaya
        
        // Merkezi 3x3 alanına gelecek süslemeleri engelle
        const distanceFromCenter = Math.sqrt(x*x + z*z);
        if (distanceFromCenter < 2.5) return null; // Merkez alanı boş bırak
        
        return (
          <group key={i} position={[x, 0.3, z]}>
            {decorationType === 0 && (
              // Ağaç
              <>
                <mesh position={[0, 0.5, 0]} castShadow>
                  <coneGeometry args={[0.4, 1.2, 5]} />
                  <meshStandardMaterial color={islandColors.trees} roughness={0.7} />
                </mesh>
                <mesh position={[0, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
                  <meshStandardMaterial color="#774411" roughness={0.8} />
                </mesh>
              </>
            )}
            
            {decorationType === 1 && (
              // Küçük bina
              <>
                <mesh position={[0, 0.3, 0]} castShadow>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.7, 0]} castShadow>
                  <coneGeometry args={[0.4, 0.4, 4]} />
                  <meshStandardMaterial color={islandColors.roofs} roughness={0.7} />
                </mesh>
              </>
            )}
            
            {decorationType === 2 && (
              // Kaya
              <mesh position={[0, 0.15, 0]} castShadow rotation={[Math.random(), Math.random(), Math.random()]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#778899" roughness={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

// Ana oyun alanı bileşeni
const Battlefield = () => {
  const { player, npc, currentEnemyWave, currentPhase } = usePeacockIslandsStore();
  
  // Savaş alanının altıgen düzeni
  const isBattlePhase = currentPhase === "battle";
  
  // Altıgen ızgara: Yaklaşık 40 altıgen - TFT tarzında
  const grid = { 
    radius: 3,  // Merkez noktadan radius kadar altıgen
    centerOffset: -0.5 // Z-ekseninde merkez kaydırma (kullanıcı tarafının biraz daha geniş olması için)
  };
  const hexSize = 0.9;
  const gridPositions: any[] = [];
  
  // Altıgen koordinatlarını dönüştürme fonksiyonları
  const hexToPixel = (q: number, r: number) => {
    const x = hexSize * 1.5 * q;
    const z = hexSize * Math.sqrt(3) * (r + q/2);
    return [x, 0.05, z];
  };
  
  // Altıgen ızgarayı oluştur
  for (let q = -grid.radius; q <= grid.radius; q++) {
    const r1 = Math.max(-grid.radius, -q - grid.radius);
    const r2 = Math.min(grid.radius, -q + grid.radius);
    
    for (let r = r1; r <= r2; r++) {
      const position = hexToPixel(q, r + grid.centerOffset);
      
      // Oyuncu ve düşman alanlarını ayır
      const isPlayerSide = position[2] < 0;
      
      gridPositions.push({
        position: position as [number, number, number],
        q, r,
        s: -q - r, // Üçüncü altıgen koordinatı
        isPlayerSide,
        isEnemySide: !isPlayerSide
      });
    }
  }
  
  // Birimleri (askerleri) yerleştir
  const playerUnits: any[] = [];
  const enemyUnits: any[] = [];
  
  // Oyuncu askerlerini rastgele yerleştir
  if (player) {
    const playerSquares = gridPositions.filter(square => square.isPlayerSide);
    const soldierCount = Math.min(player.island.army.soldiers, playerSquares.length);
    
    for (let i = 0; i < soldierCount; i++) {
      const randomIndex = Math.floor(Math.random() * playerSquares.length);
      const selectedSquare = playerSquares[randomIndex];
      
      playerUnits.push({
        position: selectedSquare.position,
        power: player.island.army.attackPower + player.island.army.bonuses.attackPower,
        health: player.island.army.health + player.island.army.bonuses.health
      });
      
      // Kullanılan kareyi kaldır
      playerSquares.splice(randomIndex, 1);
    }
  }
  
  // Düşman birimlerini yerleştir
  if (currentEnemyWave && isBattlePhase) {
    const enemySquares = gridPositions.filter(square => square.isEnemySide);
    const enemyCount = Math.min(currentEnemyWave.enemies.length, enemySquares.length);
    
    for (let i = 0; i < enemyCount; i++) {
      const enemy = currentEnemyWave.enemies[i];
      const randomIndex = Math.floor(Math.random() * enemySquares.length);
      const selectedSquare = enemySquares[randomIndex];
      
      enemyUnits.push({
        position: selectedSquare.position,
        power: enemy.attackPower,
        health: enemy.health,
        type: enemy.type
      });
      
      // Kullanılan kareyi kaldır
      enemySquares.splice(randomIndex, 1);
    }
  }
  
  // Adaları gösterme veya savaş alanını gösterme
  if (isBattlePhase) {
    // Savaş alanı (TFT tarzı)
    return (
      <group>
        {/* Arkaplan zemini - Kare şekilli oyun alanı */}
        <mesh 
          position={[0, -0.2, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#385048" />
        </mesh>
        
        {/* Oyun alanı sınırı - TFT tarzı */}
        <mesh 
          position={[0, -0.15, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
        >
          <ringGeometry args={[9, 10, 32]} />
          <meshStandardMaterial color="#aa6633" />
        </mesh>
        
        {/* Oyun alanı zemin deseni */}
        <mesh 
          position={[0, -0.14, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
        >
          <circleGeometry args={[9, 32]} />
          <meshStandardMaterial color="#88aa99" roughness={0.8} />
        </mesh>
        
        {/* Kare ızgara - TFT stilinde savaş alanı */}
        {gridPositions.map((square, i) => {
          // Bu kareye birim yerleştirilmiş mi?
          const playerUnitHere = playerUnits.find(unit => 
            unit.position[0] === square.position[0] && 
            unit.position[2] === square.position[2]
          );
          
          const enemyUnitHere = enemyUnits.find(unit => 
            unit.position[0] === square.position[0] && 
            unit.position[2] === square.position[2]
          );
          
          const isOccupied = Boolean(playerUnitHere || enemyUnitHere);
          
          return (
            <BattleHex 
              key={i}
              position={square.position}
              color={square.isPlayerSide ? "#77aa88" : "#aa7788"}
              isHighlighted={false}
              isPlayerSide={square.isPlayerSide}
              isOccupied={isOccupied}
            />
          );
        })}
        
        {/* Oyuncu askerleri */}
        {playerUnits.map((unit, i) => (
          <UnitPiece
            key={`player-unit-${i}`}
            position={unit.position}
            color="#4488ff"
            power={unit.power}
            health={unit.health}
            size={0.4}
          />
        ))}
        
        {/* Düşman birimleri */}
        {enemyUnits.map((unit, i) => (
          <UnitPiece
            key={`enemy-unit-${i}`}
            position={unit.position}
            color={
              unit.type === "chick" ? "#ffaa44" :
              unit.type === "juvenile" ? "#ff7744" :
              unit.type === "adult" ? "#ff4422" :
              "#ff0000"
            }
            power={unit.power}
            health={unit.health}
            type={unit.type}
            size={
              unit.type === "chick" ? 0.3 :
              unit.type === "juvenile" ? 0.4 :
              unit.type === "adult" ? 0.5 :
              0.6
            }
          />
        ))}
      </group>
    );
  } else {
    // Ada görünümü (hazırlık aşaması)
    return (
      <group>
        {/* Arkaplan zemini */}
        <mesh 
          position={[0, -0.2, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
        >
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#385048" />
        </mesh>
        
        {/* Gelişmiş Su Efekti - Basit Animasyonlu Versiyon */}
        <mesh 
          position={[0, -0.15, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
        >
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial 
            color="#4488aa" 
            transparent 
            opacity={0.8}
            roughness={0.1}
            metalness={0.3}
          />
        </mesh>
        
        {/* Oyuncu adası */}
        <Island 
          position={[0, 0, 0]} 
          isPlayerIsland={true} 
        />
        
        {/* Düşman adası - Uzakta */}
        <Island 
          position={[15, 0, 15]} 
          isPlayerIsland={false} 
        />
      </group>
    );
  }
};

// Kamera kontrolü - Zoom ve rotasyon özellikleri eklenmiş
const CameraController = () => {
  const { camera, gl } = useThree();
  const controls = useRef<any>();
  const { currentPhase } = usePeacockIslandsStore();
  
  // Fazlara göre kamera pozisyonları
  const isBattlePhase = currentPhase === "battle";
  
  // Zoom limitleri (TFT tarzında yakınlaşıp uzaklaşma)
  const zoomLimits = {
    min: isBattlePhase ? 6 : 5,  // Minimum zoom (daha yakın)
    max: isBattlePhase ? 20 : 15  // Maximum zoom (daha uzak)
  };
  
  useEffect(() => {
    // Kamera başlangıç pozisyonu - Faza göre değişir
    if (isBattlePhase) {
      // Savaş fazı - Üstten bakış (TFT tarzı)
      camera.position.set(0, 12, 0);
      camera.lookAt(0, 0, 0);
    } else {
      // Hazırlık fazı - Daha çapraz bir bakış
      camera.position.set(6, 8, 10);
      camera.lookAt(0, 0, 0);
    }
    
    // Kamera geçişi için animasyon
    const animateCamera = () => {
      if (controls.current) {
        controls.current.update();
      }
    };
    
    // Kamera animasyonu
    const timer = setInterval(animateCamera, 16);
    
    return () => {
      clearInterval(timer);
    };
  }, [camera, currentPhase, isBattlePhase]);

  return (
    <OrbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={isBattlePhase ? 8 : 5}
      maxDistance={isBattlePhase ? 20 : 25}
      minPolarAngle={isBattlePhase ? Math.PI / 3 : Math.PI / 6} // Alt açı limiti
      maxPolarAngle={isBattlePhase ? Math.PI / 2.1 : Math.PI / 2.5} // Üst açı limiti
      target={[0, 0, 0]}
    />
  );
};

// Ana canvas bileşeni
const GameBoard3D = () => {
  const { currentPhase } = usePeacockIslandsStore();
  const isBattlePhase = currentPhase === "battle";
  
  // Fazlara göre farklı kamera ve arka plan renkleri
  const cameraPosition: [number, number, number] = isBattlePhase ? [0, 15, 0] : [8, 10, 12];
  const backgroundColor = isBattlePhase ? "#1a3545" : "#2a4860";
  
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{
          position: [cameraPosition[0], cameraPosition[1], cameraPosition[2]],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        {/* Basitleştirilmiş Gökyüzü */}
        <Sky
          distance={300000}
          sunPosition={isBattlePhase ? [0, 0.1, -1] : [1, 0.25, 0]}
          inclination={0.5}
          azimuth={0.25}
        />
        
        {/* Ortam Aydınlatma */}
        <Environment preset={isBattlePhase ? "night" : "sunset"} />
        
        {/* Gelişmiş Işıklandırma Sistemi */}
        <ambientLight intensity={0.5} color={isBattlePhase ? "#4466aa" : "#b09080"} />
        
        {/* Ana yönlü ışık - Güneş benzeri */}
        <directionalLight 
          position={[10, 15, 5]} 
          intensity={1.8} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
          color={isBattlePhase ? "#aaccff" : "#ffcc88"}
        />
        
        {/* Yumuşak dolgu ışığı - Gölgeleri yumuşatır */}
        <directionalLight 
          position={[-8, 10, -5]} 
          intensity={0.8} 
          color={isBattlePhase ? "#5080ff" : "#ffb86c"}
          castShadow={false}
        />
        
        {/* Alt aydınlatma - Dramatik efekt */}
        <spotLight
          position={[0, -5, 0]}
          angle={Math.PI / 4}
          penumbra={0.5}
          intensity={0.3}
          color={isBattlePhase ? "#3355cc" : "#cc7733"}
          distance={20}
          castShadow={false}
        />
        
        {/* Ortam Işığı - Adayı aydınlatır */}
        <pointLight
          position={[0, 8, 0]}
          intensity={1.0}
          color={isBattlePhase ? "#3366dd" : "#ffcc66"}
          distance={30}
          decay={2}
        />
        
        {/* Kenar vurgu ışıkları */}
        <pointLight
          position={[15, 3, 15]}
          intensity={0.6}
          color={isBattlePhase ? "#66aaff" : "#ff9966"}
          distance={15}
          decay={2}
        />
        <pointLight
          position={[-15, 3, -15]}
          intensity={0.6}
          color={isBattlePhase ? "#6688ff" : "#ffcc55"}
          distance={15}
          decay={2}
        />
        
        {/* Basitleştirilmiş Atmosferik Efektler */}
        {!isBattlePhase && (
          <group position={[15, 15, -10]}>
            <mesh>
              <sphereGeometry args={[2, 16, 16]} />
              <meshStandardMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.5} 
                roughness={0.9}
              />
            </mesh>
          </group>
        )}
        
        {/* Basitleştirilmiş Parçacık Efektleri */}
        {/* Genel parlak parçacıklar - Sayısı azaltıldı */}
        <Sparkles
          count={20}
          scale={10}
          size={0.4}
          speed={0.2}
          opacity={0.15}
          color={isBattlePhase ? "#5050ff" : "#ffbb33"}
        />
        
        {/* Kamera kontrolleri */}
        <CameraController />
        
        {/* Klavye kontrolleri ve oyuncu karakteri */}
        <KeyboardControls
          map={[
            { name: "KeyW", keys: ["ArrowUp", "KeyW"] },
            { name: "KeyS", keys: ["ArrowDown", "KeyS"] },
            { name: "KeyA", keys: ["ArrowLeft", "KeyA"] },
            { name: "KeyD", keys: ["ArrowRight", "KeyD"] }
          ]}
        >
          <PenguinAvatar />
        </KeyboardControls>
        
        {/* Oyun alanı */}
        <Battlefield />
        
        {/* Basitleştirilmiş Post-processing Efektleri */}
        <EffectComposer>
          {/* Bloom efekti - Sadece en temel ayarlarla */}
          <Bloom
            intensity={0.2}
            luminanceThreshold={0.8}
          />
        </EffectComposer>
        
        {/* Gelişmiş sis efekti - Fazlara göre değişir */}
        <fog 
          attach="fog" 
          args={[
            isBattlePhase ? "#1a3040" : "#2a4860", 
            isBattlePhase ? 20 : 25, 
            isBattlePhase ? 40 : 50
          ]} 
        />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;