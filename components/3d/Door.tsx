'use client';

import * as THREE from 'three';

interface DoorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}

export default function Door({ position, rotation = [0, 0, 0], color }: DoorProps) {
  const doorWidth = 1.0;
  const doorHeight = 2.0;
  const wallThickness = 0.05;
  const offset = wallThickness / 2 + 0.005; // Slightly outside the wall
  
  const frameWidth = 0.06;
  const frameDepth = wallThickness + 0.01; // Slightly thicker than wall
  
  // Create darker shade for frame
  const frameColor = new THREE.Color(color).offsetHSL(0, 0, -0.1).getStyle();
  // Door leaf color matches carport
  const leafColor = color;

  return (
    <group position={position} rotation={rotation}>
      {/* Simulation of hole (black box) */}
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[doorWidth - 0.02, doorHeight - 0.02, wallThickness + 0.002]} />
         <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Frame - Top */}
      <mesh position={[0, doorHeight / 2 + frameWidth / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth + 2 * frameWidth, frameWidth, frameDepth]} />
        <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Frame - Left */}
      <mesh position={[-doorWidth / 2 - frameWidth / 2, frameWidth / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameWidth, doorHeight + frameWidth, frameDepth]} />
        <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Frame - Right */}
      <mesh position={[doorWidth / 2 + frameWidth / 2, frameWidth / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameWidth, doorHeight + frameWidth, frameDepth]} />
        <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Door Leaf - Front */}
      <mesh position={[0, 0, offset]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
        <meshStandardMaterial color={leafColor} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Door Leaf - Back */}
      <mesh position={[0, 0, -offset]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
        <meshStandardMaterial color={leafColor} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Handle - Front */}
      <mesh position={[0.4, 0, offset + 0.03]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Handle - Back */}
      <mesh position={[0.4, 0, -offset - 0.03]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Horizontal grooves matching wall pattern - Front */}
      {(() => {
        const grooveHeight = 0.015;
        const grooveSpacing = 0.12;
        const numGrooves = Math.floor(doorHeight / grooveSpacing);
        
        // Check if color is very light (like white) - make grooves darker for contrast
        const baseColorObj = new THREE.Color(color);
        const isLightColor = baseColorObj.getHSL({ h: 0, s: 0, l: 0 }).l > 0.85;
        const grooveColor = isLightColor 
          ? new THREE.Color(color).offsetHSL(0, 0, -0.4) 
          : new THREE.Color(color).offsetHSL(0, 0, -0.15);
        
        return Array.from({ length: numGrooves }).map((_, i) => {
          const yPos = -doorHeight/2 + grooveSpacing * (i + 0.5);
          return (
            <mesh 
              key={`door-groove-f-${i}`} 
              position={[0, yPos, offset + 0.021]}
            >
              <boxGeometry args={[doorWidth - 0.02, grooveHeight, 0.01]} />
              <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
            </mesh>
          );
        });
      })()}
      
      {/* Horizontal grooves matching wall pattern - Back */}
      {(() => {
        const grooveHeight = 0.015;
        const grooveSpacing = 0.12;
        const numGrooves = Math.floor(doorHeight / grooveSpacing);
        
        // Check if color is very light (like white) - make grooves darker for contrast
        const baseColorObj = new THREE.Color(color);
        const isLightColor = baseColorObj.getHSL({ h: 0, s: 0, l: 0 }).l > 0.85;
        const grooveColor = isLightColor 
          ? new THREE.Color(color).offsetHSL(0, 0, -0.4) 
          : new THREE.Color(color).offsetHSL(0, 0, -0.15);
        
        return Array.from({ length: numGrooves }).map((_, i) => {
          const yPos = -doorHeight/2 + grooveSpacing * (i + 0.5);
          return (
            <mesh 
              key={`door-groove-b-${i}`} 
              position={[0, yPos, -offset - 0.021]}
            >
              <boxGeometry args={[doorWidth - 0.02, grooveHeight, 0.01]} />
              <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
            </mesh>
          );
        });
      })()}
    </group>
  );
}
