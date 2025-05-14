import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';

// Hex harita oluşturucu yardımcı fonksiyonlar
const createHexPosition = (q: number, r: number, size: number = 1) => {
  // Hex koordinatlarını 3D koordinatlara dönüştür
  const x = size * (3/2 * q);
  const z = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return [x, 0, z];
};

// Hex şeklinde geometri oluştur
const HexTile = ({ position, color, isHighlighted, isPlayerSide, isOccupied = false }: any) => {
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
    
    // Altıgen rengi
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
    
    // Şeffaflık ayarı - TFT'deki gibi boş kareler hafif görünür olacak
    const targetAlpha = hovered || isHighlighted || isOccupied ? 0.9 : 0.15;
    material.opacity += (targetAlpha - material.opacity) * 10 * delta;
  });

  // Hex geometrisi oluştur
  const hexShape = new THREE.Shape();
  const size = 0.95; // Kenar aralarında boşluk bırakmak için biraz küçült
  const points = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    points.push(new THREE.Vector2(x, y));
    
    if (i === 0) {
      hexShape.moveTo(x, y);
    } else {
      hexShape.lineTo(x, y);
    }
  }
  // Şekli kapatmak için ilk noktaya dön
  hexShape.closePath();
  
  // Kenar çizgisi için geometri
  const edgeGeometry = new THREE.EdgesGeometry(
    new THREE.ExtrudeGeometry(hexShape, { 
      depth: 0.1,
      bevelEnabled: false
    })
  );
  
  return (
    <group position={position}>
      {/* Altıgen dolgusu */}
      <mesh 
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <extrudeGeometry 
          args={[
            hexShape, 
            { 
              depth: 0.1,
              bevelEnabled: true,
              bevelSegments: 2,
              bevelSize: 0.02,
              bevelThickness: 0.02
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
      <lineSegments 
        ref={lineRef} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <primitive object={edgeGeometry} />
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
  
  // Ada süsleme faktörü
  const decorationCount = 8;
    
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
      
      {/* Merkez bina - Ana kale/kışla */}
      <group position={[0, 0.5, 0]}>
        {/* Temel */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.8, 1.8]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
        </mesh>
        
        {/* Kule 1 */}
        <mesh position={[-0.6, 1.0, -0.6]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 1.2, 8]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.7} />
        </mesh>
        
        {/* Kule 1 Çatısı */}
        <mesh position={[-0.6, 1.5, -0.6]} castShadow>
          <coneGeometry args={[0.4, 0.6, 8]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
        
        {/* Kule 2 */}
        <mesh position={[0.6, 1.0, -0.6]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 1.2, 8]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.7} />
        </mesh>
        
        {/* Kule 2 Çatısı */}
        <mesh position={[0.6, 1.5, -0.6]} castShadow>
          <coneGeometry args={[0.4, 0.6, 8]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
        
        {/* Ana bina çatısı */}
        <mesh position={[0, 1.0, 0.2]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.4, 0.6, 1.2]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Ada süslemeleri - ağaçlar, yapılar ve kayalar */}
      {Array.from({ length: decorationCount }).map((_, i) => {
        const angle = (Math.PI * 2 / decorationCount) * i;
        const radius = 3; // Adanın dış çevresine daha yakın
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Dekorasyon türünü belirle: ağaç, bina veya kaya
        const decorationType = i % 3; // 0: ağaç, 1: bina, 2: kaya
        
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
                  <boxGeometry args={[0.6, 0.6, 0.6]} />
                  <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.7, 0]} castShadow>
                  <coneGeometry args={[0.45, 0.5, 4]} />
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
  
  // Savaş alanının kareli düzeni
  const isBattlePhase = currentPhase === "battle";
  
  // Hex harita ızgarası: 40 adet altıgen (8x5 grid)
  const hexGrid = { width: 8, height: 5 };
  const hexSize = 1;
  const hexPositions: any[] = [];
  
  // Hex pozisyonlarını hesapla
  for (let col = 0; col < hexGrid.width; col++) {
    for (let row = 0; row < hexGrid.height; row++) {
      // Offset, her satır için altıgenleri kaydırarak yerleştir
      const xOffset = (row % 2) * 0.5;
      const x = (col + xOffset) * (hexSize * 1.5);
      const z = row * (hexSize * Math.sqrt(3) * 0.85);
      
      // Oyuncu ve düşman alanlarını ayır
      const isPlayerSide = row < Math.floor(hexGrid.height / 2);
      
      hexPositions.push({
        position: [x - (hexGrid.width * 0.75), 0, z - (hexGrid.height * 0.6)] as [number, number, number],
        col, row,
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
    const playerHexes = hexPositions.filter(hex => hex.isPlayerSide);
    const soldierCount = Math.min(player.island.army.soldiers, playerHexes.length);
    
    for (let i = 0; i < soldierCount; i++) {
      const randomHexIndex = Math.floor(Math.random() * playerHexes.length);
      const selectedHex = playerHexes[randomHexIndex];
      
      playerUnits.push({
        position: selectedHex.position,
        power: player.island.army.attackPower + player.island.army.bonuses.attackPower,
        health: player.island.army.health + player.island.army.bonuses.health
      });
      
      // Kullanılan hexi kaldır
      playerHexes.splice(randomHexIndex, 1);
    }
  }
  
  // Düşman birimlerini yerleştir
  if (currentEnemyWave && isBattlePhase) {
    const enemyHexes = hexPositions.filter(hex => hex.isEnemySide);
    const enemyCount = Math.min(currentEnemyWave.enemies.length, enemyHexes.length);
    
    for (let i = 0; i < enemyCount; i++) {
      const enemy = currentEnemyWave.enemies[i];
      const randomHexIndex = Math.floor(Math.random() * enemyHexes.length);
      const selectedHex = enemyHexes[randomHexIndex];
      
      enemyUnits.push({
        position: selectedHex.position,
        power: enemy.attackPower,
        health: enemy.health,
        type: enemy.type
      });
      
      // Kullanılan hexi kaldır
      enemyHexes.splice(randomHexIndex, 1);
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
        
        {/* Hex harita - Dolu veya boş durumlarına göre render et */}
        {hexPositions.map((hex, i) => {
          // Bu hex'e birim yerleştirilmiş mi?
          const playerUnitHere = playerUnits.find(unit => 
            unit.position[0] === hex.position[0] && 
            unit.position[2] === hex.position[2]
          );
          
          const enemyUnitHere = enemyUnits.find(unit => 
            unit.position[0] === hex.position[0] && 
            unit.position[2] === hex.position[2]
          );
          
          const isOccupied = Boolean(playerUnitHere || enemyUnitHere);
          
          return (
            <HexTile 
              key={i}
              position={hex.position}
              color={hex.isPlayerSide ? "#77aa88" : "#aa7788"}
              isHighlighted={false}
              isPlayerSide={hex.isPlayerSide}
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
        
        {/* Su efekti */}
        <mesh 
          position={[0, -0.15, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
        >
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial 
            color="#4488aa" 
            transparent 
            opacity={0.7}
            roughness={0.1}
            metalness={0.2}
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

// Kamera kontrolü
const CameraController = () => {
  const { camera, gl } = useThree();
  const controls = useRef<any>();
  const { currentPhase } = usePeacockIslandsStore();
  
  // Fazlara göre kamera pozisyonları
  const isBattlePhase = currentPhase === "battle";
  
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
  const cameraPosition: [number, number, number] = isBattlePhase ? [0, 12, 0] : [6, 8, 10];
  const backgroundColor = isBattlePhase ? "#345564" : "#4a6880";
  
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
        
        {/* Işıklandırma */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        
        {/* İkincil ışık - daha yumuşak gölgeler için */}
        <directionalLight 
          position={[-8, 8, -5]} 
          intensity={0.5} 
          castShadow={false}
        />
        
        {/* Kamera kontrolleri */}
        <CameraController />
        
        {/* Oyun alanı */}
        <Battlefield />
        
        {/* Hafif sis efekti */}
        <fog attach="fog" args={[backgroundColor, 25, 50]} />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;