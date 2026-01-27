'use client';

import { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';

interface ClickablePostProps {
  id: string;
  position: [number, number, number];
  height: number;
  color: string;
  onRemove: (id: string) => void;
}

export default function ClickablePost({ id, position, height, color, onRemove }: ClickablePostProps) {
  const [hovered, setHovered] = useState(false);
  const postSize = 0.1;
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onRemove(id);
  };
  
  return (
    <mesh 
      position={position} 
      castShadow 
      receiveShadow
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[postSize, height, postSize]} />
      <meshStandardMaterial 
        color={hovered ? '#ef4444' : color} 
        metalness={0.6} 
        roughness={0.4}
        emissive={hovered ? '#ef4444' : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  );
}
