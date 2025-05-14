import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { FeatherModel, EggModel, PeacockWarriorModel, HumanSoldierModel } from "./3DModels";

// Kenar tüy modeli görüntüleyici
export function FeatherViewer({ color = "green", rotate = true, scale = 1, className = "" }: { 
  color?: "green" | "blue" | "orange"; 
  rotate?: boolean;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[0, 0, 2]} intensity={0.6} color={
          color === "green" ? "#00ff88" : 
          color === "blue" ? "#2288ff" : 
          "#ff8800"
        } />
        
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color={
              color === "green" ? "#00ff88" : 
              color === "blue" ? "#2288ff" : 
              "#ff8800"
            } />
          </mesh>
        }>
          <FeatherModel 
            color={color}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={scale * 2.5} // Scale up for better visibility
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={3} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}

// Yumurta model görüntüleyici
export function EggViewer({ color = "green", rotate = true, scale = 1, isActive = false, className = "" }: { 
  color?: "green" | "blue" | "orange"; 
  rotate?: boolean;
  scale?: number;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[0, 0, 2]} intensity={isActive ? 1.2 : 0.6} color={
          color === "green" ? "#00ff88" : 
          color === "blue" ? "#2288ff" : 
          "#ff8800"
        } />
        
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial 
              color={
                color === "green" ? "#00ff88" : 
                color === "blue" ? "#2288ff" : 
                "#ff8800"
              } 
              emissive={
                color === "green" ? "#00aa44" : 
                color === "blue" ? "#0044aa" : 
                "#aa4400"
              }
              emissiveIntensity={isActive ? 0.8 : 0.3}
            />
          </mesh>
        }>
          <EggModel 
            color={color}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={scale * 2.5} // Scale up for better visibility
            isActive={isActive}
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={isActive ? 3 : 2} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}

// Tavus Kuşu Savaşçı model görüntüleyici
export function PeacockWarriorViewer({ type = "adult", rotate = true, scale = 1, className = "" }: { 
  type?: "chick" | "juvenile" | "adult" | "alpha"; 
  rotate?: boolean;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[0, 0, 2]} intensity={type === "alpha" ? 1 : 0.6} color={
          type === "chick" ? "#ffcc44" :
          type === "juvenile" ? "#ff9944" :
          type === "alpha" ? "#ff3333" :
          "#ff6644" // adult
        } />
        
        <Suspense fallback={
          <group>
            <mesh position={[0, -0.5, 0]} scale={[0.3, 0.7, 0.3]}>
              <boxGeometry />
              <meshStandardMaterial 
                color={
                  type === "chick" ? "#ffcc44" :
                  type === "juvenile" ? "#ff9944" :
                  type === "alpha" ? "#ff3333" :
                  "#ff6644" // adult
                }
                emissive={type === "alpha" ? "#ff3300" : "#000000"}
                emissiveIntensity={type === "alpha" ? 0.5 : 0}
              />
            </mesh>
            <mesh position={[0, 0, 0]} scale={0.2}>
              <sphereGeometry />
              <meshStandardMaterial color={
                type === "chick" ? "#ffcc44" :
                type === "juvenile" ? "#ff9944" :
                type === "alpha" ? "#ff3333" :
                "#ff6644" // adult
              } />
            </mesh>
          </group>
        }>
          <PeacockWarriorModel 
            position={[0, -1, 0]}
            rotation={[0, 0, 0]}
            scale={scale * 2.5} // Scale up for better visibility
            type={type}
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={type === "alpha" ? 3 : 2} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}

// İnsan Asker model görüntüleyici
export function HumanSoldierViewer({ rotate = true, scale = 1, className = "" }: { 
  rotate?: boolean;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[0, 0, 2]} intensity={0.6} color="#8899ff" />
        
        <Suspense fallback={
          <group>
            <mesh position={[0, -0.5, 0]} scale={[0.3, 0.7, 0.3]}>
              <boxGeometry />
              <meshStandardMaterial 
                color="#5566aa"
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0, 0]} scale={0.2}>
              <sphereGeometry />
              <meshStandardMaterial color="#aabadd" />
            </mesh>
          </group>
        }>
          <HumanSoldierModel 
            position={[0, -1, 0]}
            rotation={[0, 0, 0]}
            scale={scale * 2.5} // Scale up for better visibility
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}