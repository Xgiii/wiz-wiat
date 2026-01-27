'use client';

import { StorageRoomConfig } from '@/types/carport';

interface StorageRoomProps {
  position: [number, number, number];
  width: number;
  height: number;
  config: StorageRoomConfig;
  color: string;
}

export default function StorageRoom({ position, width, height, config, color }: StorageRoomProps) {
  if (!config.enabled) return null;
  
  const { depth } = config;
  const wallThickness = 0.05;
  
  return (
    <group position={position}>
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Front wall */}
      <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
