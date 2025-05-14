import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../lib/stores/useGameStore";

const DragControls = () => {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const canvasRef = useRef(gl.domElement);
  
  const {
    selectedCard,
    setSelectedCard,
    hoveredHex,
    placeCard
  } = useGameStore();
  
  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      // If no card is selected, do nothing
      if (!selectedCard) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Cast a ray from the camera through the mouse position
      raycaster.current.setFromCamera(mouse.current, camera);
      
      // Create a "ground" plane to intersect with
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const targetPosition = new THREE.Vector3();
      
      // Find intersection with the ground plane
      raycaster.current.ray.intersectPlane(groundPlane, targetPosition);
      
      // You can use targetPosition to update the position of a preview card
      // or highlight the nearest hex tile
    };
    
    const handlePointerDown = (event: MouseEvent) => {
      // Only handle left click
      if (event.button !== 0) return;
      
      // If a card is selected and a hex is hovered, place the card
      if (selectedCard && hoveredHex) {
        placeCard(selectedCard, hoveredHex);
        setSelectedCard(null);
      }
    };
    
    // Add event listeners
    canvasRef.current.addEventListener('pointermove', handlePointerMove);
    canvasRef.current.addEventListener('pointerdown', handlePointerDown);
    
    return () => {
      // Clean up event listeners
      canvasRef.current.removeEventListener('pointermove', handlePointerMove);
      canvasRef.current.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [camera, selectedCard, hoveredHex, placeCard, setSelectedCard]);
  
  return null; // This component doesn't render anything visually
};

export default DragControls;
