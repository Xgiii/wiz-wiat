'use client';

import { RoofType } from '@/types/carport';

interface RoofProps {
  width: number;
  depth: number;
  position: [number, number, number];
  roofType: RoofType;
  color: string;
}

// Trapezoidal metal sheet component
function TrapezoidalRoof({ width, depth, position, color }: { 
  width: number; 
  depth: number; 
  position: [number, number, number]; 
  color: string;
}) {
  const trapezoidWidth = 0.15; // Width of each trapezoid profile
  const trapezoidHeight = 0.04; // Height of the raised part
  const baseHeight = 0.02; // Base plate thickness
  const numProfiles = Math.floor(depth / trapezoidWidth); // Now based on depth
  const offsetZ = -depth / 2 + trapezoidWidth / 2;

  return (
    <group position={position}>
      {/* Base plate */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, baseHeight, depth]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      
      {/* Trapezoid profiles - running along depth (front to back) */}
      {Array.from({ length: numProfiles }).map((_, i) => {
        const zPos = offsetZ + i * trapezoidWidth;
        // Alternate between raised and flat to create trapezoid pattern
        const isRaised = i % 2 === 0;
        
        if (isRaised) {
          return (
            <mesh 
              key={`trap-${i}`} 
              position={[0, baseHeight / 2 + trapezoidHeight / 2 + 0.001, zPos]} 
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[width - 0.002, trapezoidHeight, trapezoidWidth * 0.6]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.25} />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}

export default function Roof({ width, depth, position, roofType, color }: RoofProps) {
  const roofThickness = 0.05;
  
  // For metal roof, use trapezoidal sheet
  if (roofType === 'metal') {
    return <TrapezoidalRoof width={width} depth={depth} position={position} color={color} />;
  }
  
  // Different materials based on roof type
  const getMaterial = () => {
    switch (roofType) {
      case 'glass':
        return (
          <meshPhysicalMaterial
            color="#88ccff"
            transparent
            opacity={0.3}
            metalness={0}
            roughness={0}
            transmission={0.9}
            thickness={0.5}
          />
        );
      case 'polycarbonate':
        return (
          <meshPhysicalMaterial
            color="#f0f0e8"
            transparent
            opacity={0.6}
            metalness={0}
            roughness={0.3}
            transmission={0.5}
          />
        );
      default:
        return (
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.3}
          />
        );
    }
  };
  
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, roofThickness, depth]} />
      {getMaterial()}
    </mesh>
  );
}
