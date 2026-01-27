'use client';

import * as THREE from 'three';

interface BeamProps {
  position: [number, number, number];
  length: number;
  rotation?: [number, number, number];
  color: string;
  isAttic?: boolean; // Attika (fascia board) - taller profile with ridges
  isFlat?: boolean;  // Flat fascia without grooves (for gutter side)
}

export default function Beam({ position, length, rotation = [0, 0, 0], color, isAttic = false, isFlat = false }: BeamProps) {
  const beamHeight = isAttic ? 0.4 : 0.1;
  const beamDepth = 0.1;
  
  // Simple beam for roof supports OR flat fascia without grooves
  if (!isAttic || isFlat) {
    return (
      <mesh 
        position={position} 
        rotation={rotation}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[length, beamHeight, beamDepth]} />
        <meshStandardMaterial color={color} metalness={isAttic ? 0.7 : 0.6} roughness={isAttic ? 0.35 : 0.4} />
      </mesh>
    );
  }
  
  // Detailed fascia (attic) with horizontal groove profiles
  const grooveHeight = 0.02; // Height of each groove
  const grooveDepth = 0.02; // How deep the grooves are
  
  // Check if color is very light (like white) - if so, make grooves much darker for contrast
  const baseColor = new THREE.Color(color);
  const isLightColor = baseColor.getHSL({ h: 0, s: 0, l: 0 }).l > 0.85;
  
  // For light colors: grooves are significantly darker for contrast
  // For dark colors: grooves are slightly darker than main panel
  const grooveColor = isLightColor 
    ? new THREE.Color(color).offsetHSL(0, 0, -0.4) 
    : new THREE.Color(color).offsetHSL(0, 0, -0.15);
  
  return (
    <group position={position} rotation={rotation}>
      {/* Main continuous panel */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, beamHeight, beamDepth]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} />
      </mesh>
      
      {/* Front side grooves */}
      {/* First groove (upper) */}
      <mesh position={[0, 0.04, beamDepth / 2 - grooveDepth / 2 + 0.001]}>
        <boxGeometry args={[length + 0.002, grooveHeight, grooveDepth]} />
        <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Second groove (lower) */}
      <mesh position={[0, -0.04, beamDepth / 2 - grooveDepth / 2 + 0.001]}>
        <boxGeometry args={[length + 0.002, grooveHeight, grooveDepth]} />
        <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
      </mesh>
      
      {/* Back side grooves */}
      {/* First groove (upper) */}
      <mesh position={[0, 0.04, -beamDepth / 2 + grooveDepth / 2 - 0.001]}>
        <boxGeometry args={[length + 0.002, grooveHeight, grooveDepth]} />
        <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Second groove (lower) */}
      <mesh position={[0, -0.04, -beamDepth / 2 + grooveDepth / 2 - 0.001]}>
        <boxGeometry args={[length + 0.002, grooveHeight, grooveDepth]} />
        <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
      </mesh>
    </group>
  );
}
