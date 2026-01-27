'use client';

import { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';

interface ClickablePanelProps {
  id: string;
  position: [number, number, number];
  height: number;
  rotation: number;
  color: string;
  onRemove: (id: string) => void;
}

export default function ClickablePanel({ id, position, height, rotation, color, onRemove }: ClickablePanelProps) {
  const [hovered, setHovered] = useState(false);
  
  const panelWidth = 1.5;
  const panelDepth = 0.05;
  const slatHeight = 0.08;
  const slatGap = 0.04;
  const numSlats = Math.floor(height / (slatHeight + slatGap));
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onRemove(id);
  };
  
  return (
    <group 
      position={position} 
      rotation={[0, rotation, 0]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Render horizontal slats (lamele) */}
      {Array.from({ length: numSlats }).map((_, i) => {
        const yPos = -height / 2 + (i + 0.5) * (slatHeight + slatGap);
        return (
          <mesh key={i} position={[0, yPos, 0]} castShadow receiveShadow>
            <boxGeometry args={[panelWidth, slatHeight, panelDepth]} />
            <meshStandardMaterial 
              color={hovered ? '#ef4444' : color} 
              metalness={0.6} 
              roughness={0.4}
              emissive={hovered ? '#ef4444' : '#000000'}
              emissiveIntensity={hovered ? 0.3 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
