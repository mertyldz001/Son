import { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  useTexture,
  Environment, 
  Sparkles,
  Float,
  MeshDistortMaterial,
  PresentationControls,
  PerspectiveCamera,
  OrthographicCamera
} from '@react-three/drei';

// Performans için efektler kaldırıldı
// import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';
import { PenguinAvatar } from './PenguinAvatar';
import HexGrid from './HexGrid';
import { getDeployedUnitPositionsMap } from '../../lib/game/peacockIslands/unitSystem';

// Animasyonlu su yüzeyi bileşeni - performans için optimize edildi
const AnimatedWater = ({ position = [0, 0, 0], size = 20 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0); // useState yerine useRef kullan - daha yüksek performans
  const frameSkipRef = useRef(0); // Her frame'i işleme - performans optimize
  
  // Su materyal ayarları - memo ile hesaplamaları önle
  const waterMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#4466aa",
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
  }, []);
  
  // Su geometrisi - daha az poligon ile daha hızlı render
  const waterGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(size, size, 10, 10); // çok daha az segment
  }, [size]);
  
  useFrame((_, delta) => {
    // Her 4 karede bir güncelle - maksimum performans artışı
    frameSkipRef.current++;
    if (frameSkipRef.current < 4) return;
    frameSkipRef.current = 0;
    
    // Ultra hafif animasyon hesaplaması
    timeRef.current += delta * 0.1; // daha da düşük değer
    
    if (meshRef.current) {
      // Daha da basitleştirilmiş dalga animasyonu
      meshRef.current.rotation.z = Math.sin(timeRef.current * 0.02) * 0.03;
    }
  });
  
  // TypeScript güvenliği için - pozisyon doğrulama
  const safePosition = Array.isArray(position) ? 
    [position[0] || 0, position[1] || 0, position[2] || 0] as [number, number, number] : 
    [0, 0, 0] as [number, number, number];
  
  return (
    <mesh 
      ref={meshRef} 
      position={safePosition} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
    >
      <primitive attach="geometry" object={waterGeometry} />
      <primitive attach="material" object={waterMaterial} />
    </mesh>
  );
};

// Oyuncu adası
const PlayerIsland = ({ position = [0, 0, 0] as [number, number, number] }) => {
  // Ada renkleri
  const islandColors = { 
    base: "#aa8899", 
    terrain: "#b38598", 
    buildings: "#a48871", 
    trees: "#aa3333",
    roofs: "#553322"
  };

  // Ada süsleme faktörü - kenarlar boyunca
  const decorationCount = 12;  // Daha fazla süs ekle
  
  // TypeScript hata düzeltmesi (3. İstek)
  const safePosition = Array.isArray(position) ? 
    [position[0] || 0, position[1] || 0, position[2] || 0] as [number, number, number] : 
    [0, 0, 0] as [number, number, number];
    
  return (
    <group position={safePosition}>
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
      
      {/* Ana ada platformu - düzleştirilmiş */}
      <mesh 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5.5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.base} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Üst ada zemin katmanı */}
      <mesh 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.terrain} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ada kenarı süslemeler - daha düzenli dizilim */}
      <group>
        {Array.from({ length: decorationCount }).map((_, index) => {
          // Süsler için çevre etrafında açısal konumlar
          const angle = (index / decorationCount) * Math.PI * 2;
          // Adanın kenarında - yarıçapı 4.5 birim
          const posX = Math.sin(angle) * 4.5;
          const posZ = Math.cos(angle) * 4.5;
          
          // Her 3 süsten biri için dekorasyon tipini değiştir
          const decorationType = index % 3;
          
          return (
            <group 
              key={`decor_${index}`} 
              position={[posX, 0, posZ]}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            >
              {decorationType === 0 && (
                // Ağaç 
                <mesh position={[0, 0.5, 0]} castShadow>
                  {/* Gövde */}
                  <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
                  <meshStandardMaterial color="#774433" roughness={0.9} />
                </mesh>
              )}
              
              {decorationType === 1 && (
                // Küçük yapı
                <>
                  <mesh position={[0, 0.25, 0]} castShadow>
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
    </group>
  );
};

// Düşman adası - oyuncu adasının farklı renkli versiyonu
const EnemyIsland = ({ position = [0, 0, 0] }) => {
  // Düşman ada renkleri - kırmızımsı tonlar
  const islandColors = { 
    base: "#995555", 
    terrain: "#8c4545", 
    buildings: "#8c6c65", 
    trees: "#653333",
    roofs: "#331111"
  };

  // Ada süsleme faktörü - kenarlar boyunca
  const decorationCount = 12;
  
  // TypeScript hata düzeltmesi (3. İstek)
  const safePosition = Array.isArray(position) ? 
    [position[0] || 0, position[1] || 0, position[2] || 0] as [number, number, number] : 
    [0, 0, 0] as [number, number, number];
    
  return (
    <group position={safePosition}>
      {/* Deniz altı bazı */}
      <mesh 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5.5, 6.5, 0.5, 8]} />
        <meshStandardMaterial 
          color="#553333" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ana ada platformu - düzleştirilmiş */}
      <mesh 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5.5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.base} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Üst ada zemin katmanı */}
      <mesh 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.terrain} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ada kenarı süslemeler */}
      <group>
        {Array.from({ length: decorationCount }).map((_, index) => {
          // Süsler için çevre etrafında açısal konumlar
          const angle = (index / decorationCount) * Math.PI * 2;
          // Adanın kenarında - yarıçapı 4.5 birim
          const posX = Math.sin(angle) * 4.5;
          const posZ = Math.cos(angle) * 4.5;
          
          // Her 3 süsten biri için dekorasyon tipini değiştir
          const decorationType = (index + 1) % 3; // Oyuncu adasından farklılaştır
          
          return (
            <group 
              key={`decor_${index}`} 
              position={[posX, 0, posZ]}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            >
              {decorationType === 0 && (
                // Ağaç 
                <mesh position={[0, 0.5, 0]} castShadow>
                  {/* Gövde */}
                  <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
                  <meshStandardMaterial color="#442211" roughness={0.9} />
                </mesh>
              )}
              
              {decorationType === 1 && (
                // Küçük yapı
                <>
                  <mesh position={[0, 0.25, 0]} castShadow>
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
                  <meshStandardMaterial color="#554433" roughness={0.9} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};

// Ana oyun alanı
const GameScene = () => {
  const { currentPhase, player } = usePeacockIslandsStore();
  const [zoom, setZoom] = useState(30);
  const [hoveredHex, setHoveredHex] = useState<{q: number, r: number, s: number} | null>(null);
  const [dragCursor, setDragCursor] = useState<{
    visible: boolean;
    type: "warrior" | "soldier" | null;
    unitId: string | null;
  }>({
    visible: false,
    type: null,
    unitId: null
  });
  
  // Kamera açısını doğru ayarla
  useEffect(() => {
    console.log("Kamera açısı düzeltildi");
  }, []);
  
  // Yerleştirilmiş birimleri al
  const deployedUnitPositions = useMemo(() => {
    return getDeployedUnitPositionsMap(player.island.units);
  }, [player.island.units]);
  
  // Kamera kontrolü için
  useEffect(() => {
    console.log("Kamera kontrolleri temizlendi");
    
    // Zoom kontrolü için klavye eventleri
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        console.log("Yakınlaşma komutu alındı");
        if (zoom > 18) { // Minimum zoom (daha yakın)
          setZoom(z => {
            const newZoom = z - 2.5;
            console.log("Yeni zoom seviyesi:", newZoom);
            return newZoom;
          });
        }
      } else if (e.key === '-' || e.key === '_') {
        console.log("Uzaklaşma komutu alındı");
        if (zoom < 40) { // Maksimum zoom (daha uzak)
          setZoom(z => {
            const newZoom = z + 2.5;
            console.log("Yeni zoom seviyesi:", newZoom);
            return newZoom;
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    console.log("⚙️ KAMERA KONTROL SİSTEMİ HAZIR:");
    console.log("✓ + tuşu: Yakınlaş");
    console.log("✓ - tuşu: Uzaklaş");
    console.log("Kamera kontrol fonksiyonu aktif edildi");
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoom]);
  
  // Unit sürükleme takibi için - memoize event handlers
  const handleDragStart = useCallback((e: CustomEvent) => {
    if (e?.detail?.unit) {
      const unit = e.detail.unit;
      setDragCursor({
        visible: true,
        type: unit.type,
        unitId: unit.id
      });
    }
  }, []);
    
  // Birim sürükleme bitişi - memoize
  const handleDragEnd = useCallback(() => {
    setDragCursor({
      visible: false,
      type: null,
      unitId: null
    });
  }, []);
    
  // Hex tıklama olayını dinle - memoize ile performans artışı
  const handleHexClick = useCallback((e: CustomEvent) => {
    // Sürükleme aktifse ve tıklanan hex konumu geçerliyse
    if (!e?.detail?.hexCoords) return;
    
    // Performans için erken return pattern
    const hexCoords = e.detail.hexCoords;
    const { isPlayerSide, isOccupied } = e.detail;
    
    if (dragCursor.visible && dragCursor.unitId) {  
      // Sadece oyuncu tarafına ve boş hücrelere yerleştir
      if (isPlayerSide && !isOccupied) {
        // Sürüklemeyi temizle
        setDragCursor({
          visible: false,
          type: null,
          unitId: null
        });
      }
    }
  }, [dragCursor]);
  
  // Event listener'ları sadece bir kere ekle
  useEffect(() => {
    // Event dinleyicilerini ekle
    window.addEventListener('unit-drag-start', handleDragStart as EventListener);
    window.addEventListener('unit-drag-end', handleDragEnd as EventListener);
    window.addEventListener('hex-click', handleHexClick as EventListener);
    
    return () => {
      window.removeEventListener('unit-drag-start', handleDragStart as EventListener);
      window.removeEventListener('unit-drag-end', handleDragEnd as EventListener);
      window.removeEventListener('hex-click', handleHexClick as EventListener);
    };
  }, [handleDragStart, handleDragEnd, handleHexClick]);
  
  // Hex üzerine gelme eventi - memoize ile performans artırma
  const handleHexHover = useCallback((coords: {q: number, r: number, s: number}) => {
    setHoveredHex(coords);
  }, []);
  
  return (
    <>
      {/* TFT tarzı optimum görünüm için kamera ayarı */}
      {/* Daha uzaktan bakan ama açılı kamera - oyun alanı tam ortalanıyor */}
      <PerspectiveCamera 
        position={[0, 26, 28]} 
        rotation={[-Math.PI/4, 0, 0]} 
        fov={42}
        near={0.1} 
        far={500} // Daha kısa far değeri - performans için
        makeDefault
        // Frustum kısıtlaması - görünmez nesneler için render engellemesi
        frustumCulled={true}
      />
      
      {/* Işıklandırma - optimize edilmiş - daha az ışık kaynağı */}
      <ambientLight intensity={0.9} /> {/* Ortam ışığını artırıyoruz böylece diğer ışıkları azaltabiliriz */}
      
      {/* Ana ışık kaynağı - optimize edilmiş shadow map */}
      <directionalLight 
        position={[5, 15, 8]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]} // Daha düşük çözünürlük - daha hızlı render
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      {/* Sadece bir yardımcı ışık - performans optimizasyonu */}
      <pointLight position={[-5, 10, -5]} intensity={0.5} color="#88ccff" />
      
      {/* Glow efektleri kaldırıldı - performans için */}
      
      {/* Arka plan rengi - daha açık ve modern */}
      <color attach="background" args={['#364c6b']} />
      
      {/* TFT stili arena zemini - parlak ve derinlikli */}
      <group position={[0, -0.25, 6]}>
        {/* Ana zemin */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]} 
          receiveShadow
        >
          <planeGeometry args={[22, 15]} />
          <meshStandardMaterial 
            color="#25a047"  // Ekran görüntüsündeki gibi parlak yeşil
            roughness={0.4} 
            metalness={0.2}
            emissive="#207537"
            emissiveIntensity={0.1}
          />
        </mesh>
        
        {/* Dekoratif kenar - TFT arena stili */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
          receiveShadow
        >
          <ringGeometry args={[10, 10.5, 6]} />
          <meshStandardMaterial 
            color="#c0c0d0"
            emissive="#8080a0"
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Parlak ışık halkası - TFT stili */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.1, 0]}
        >
          <ringGeometry args={[9.5, 9.8, 6]} />
          <meshBasicMaterial 
            color="#80a0ff"
            transparent={true}
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* Hexagonal Savaş Alanı - TFT stili - yeni minimal tasarım */}
      <group position={[0, 0.05, 0]} scale={1.5}>
        <HexGrid 
          size={0.7} 
          gridWidth={7} 
          gridHeight={6} 
          unitPositions={deployedUnitPositions}
          onTileHover={handleHexHover}
        />
        
        {/* Sürüklenen birimin görsel önizlemesi - eğer varsa ve cursor hex üzerindeyse */}
        {dragCursor.visible && hoveredHex && (
          <group position={[
            0.7 * 2 * (hoveredHex.q - 3.5 + 0.5), // Merkezi hizalama için düzeltme - yeni boyuta göre
            0.5, // y pozisyonu (yerden yükseklik)
            hoveredHex.r * 0.7 * 2 // hex boyutuna göre z pozisyonu - yeni boyuta göre ayarlandı
          ]}>
            {dragCursor.type === 'warrior' ? (
              <PeacockWarriorModel 
                position={[0, 0, 0]} 
                rotation={[0, Math.PI, 0]} 
                scale={0.3} 
                type="adult" 
              />
            ) : (
              <HumanSoldierModel 
                position={[0, 0, 0]} 
                rotation={[0, Math.PI, 0]} 
                scale={0.3} 
              />
            )}
          </group>
        )}
      </group>
      
      {/* Oyuncu karakteri */}
      <PenguinAvatar />
      
      {/* Görsel efektler performans için kaldırıldı */}
    </>
  );
};

// Ana canvas bileşeni
const GameBoard3D = () => {
  const { currentPhase } = usePeacockIslandsStore();
  const isBattlePhase = currentPhase === "battle";
  
  // Kamera değerleri Canvas içinde kullanılmıyor artık - PerspectiveCamera bileşenini kullanıyoruz
  const backgroundColor = isBattlePhase ? "#2e5a7a" : "#3d6c95"; // Çok daha canlı ve modern arkaplan
  
  // Zoom butonlarını kaldırdık sadece sabit değerlerle çalışıyoruz
  const handleZoomInClick = () => {
    console.log("Bu fonksiyon geçici olarak devre dışı");
  };
  
  const handleZoomOutClick = () => {
    console.log("Bu fonksiyon geçici olarak devre dışı");
  };
  
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      {/* TFT tarzı yeşil zemin eklendi */}
      {/* TFT tarzı gradyan zemin - daha parlak */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-700 to-green-500 opacity-40 z-0"></div>
      
      {/* Zoom butonları - Mobil için özel tasarım */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-6 z-50">
        <button 
          type="button"
          onClick={handleZoomInClick}
          className="w-16 h-16 md:w-12 md:h-12 rounded-full bg-black bg-opacity-70 text-white text-3xl flex items-center justify-center hover:bg-opacity-100 focus:outline-none active:bg-opacity-100 shadow-2xl border-2 border-white border-opacity-30"
        >
          +
        </button>
        <button 
          type="button"
          onClick={handleZoomOutClick}
          className="w-16 h-16 md:w-12 md:h-12 rounded-full bg-black bg-opacity-70 text-white text-3xl flex items-center justify-center hover:bg-opacity-100 focus:outline-none active:bg-opacity-100 shadow-2xl border-2 border-white border-opacity-30"
        >
          -
        </button>
      </div>
      
      <Canvas
        shadows
        className="w-full max-w-4xl h-full max-h-[85vh] mx-auto my-auto touch-action-none"
        // Kamera ayarları artık PerspectiveCamera bileşeni içinde yönetiliyor
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
        onCreated={({ gl }) => {
          // Mobil için multi-touch sorunlarını gider
          gl.domElement.style.touchAction = 'none';
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        {/* Ana sahne */}
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GameBoard3D;