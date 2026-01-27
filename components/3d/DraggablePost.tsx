'use client';

import { useRef, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface DraggablePostProps {
  id: string;
  position: [number, number, number];
  height: number;
  color: string;
  carportWidth: number;
  carportDepth: number;
  onPositionChange: (id: string, x: number, z: number) => void;
  onRemove: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function DraggablePost({ 
  id, 
  position, 
  height, 
  color, 
  carportWidth,
  carportDepth,
  onPositionChange,
  onRemove,
  onDragStart,
  onDragEnd
}: DraggablePostProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const postSize = 0.1;
  const clickTimeRef = useRef(0);
  
  const halfWidth = carportWidth / 2;
  const halfDepth = carportDepth / 2;
  
  // Snap to 0.5m grid
  const snapToGrid = (value: number, gridSize: number = 0.5): number => {
    return Math.round(value / gridSize) * gridSize;
  };
  
  // Constrain to carport perimeter (edges only)
  const constrainToPerimeter = (x: number, z: number): { x: number; z: number } => {
    // Find closest edge
    const distToLeft = Math.abs(x - (-halfWidth));
    const distToRight = Math.abs(x - halfWidth);
    const distToFront = Math.abs(z - halfDepth);
    const distToBack = Math.abs(z - (-halfDepth));
    
    const minDist = Math.min(distToLeft, distToRight, distToFront, distToBack);
    
    // Snap to closest edge
    if (minDist === distToLeft) {
      return { x: -halfWidth, z: Math.max(-halfDepth, Math.min(halfDepth, z)) };
    } else if (minDist === distToRight) {
      return { x: halfWidth, z: Math.max(-halfDepth, Math.min(halfDepth, z)) };
    } else if (minDist === distToFront) {
      return { x: Math.max(-halfWidth, Math.min(halfWidth, x)), z: halfDepth };
    } else {
      return { x: Math.max(-halfWidth, Math.min(halfWidth, x)), z: -halfDepth };
    }
  };
  
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    clickTimeRef.current = Date.now();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onDragStart?.();
  };
  
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isDragging && meshRef.current) {
      const pos = meshRef.current.position;
      const constrained = constrainToPerimeter(pos.x, pos.z);
      const snappedX = snapToGrid(constrained.x);
      const snappedZ = snapToGrid(constrained.z);
      onPositionChange(id, snappedX, snappedZ);
    }
    setIsDragging(false);
    onDragEnd?.();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();
    
    // Use raycaster to find intersection with ground plane (y=0)
    // This provides stable dragging regardless of where on the post we clicked
    const raycaster = e.ray;
    // Plane defined by normal (0,1,0) and constant 0
    const planeNormal = new THREE.Vector3(0, 1, 0);
    const planeConstant = 0;
    const plane = new THREE.Plane(planeNormal, planeConstant);
    const target = new THREE.Vector3();
    
    raycaster.intersectPlane(plane, target);
    
    if (target) {
      const constrained = constrainToPerimeter(target.x, target.z);
      meshRef.current.position.x = constrained.x;
      meshRef.current.position.z = constrained.z;
    }
  };
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Only process click if it was a short click (not a drag)
    if (Date.now() - clickTimeRef.current < 200) {
      // Double-click to remove
      if (e.detail === 2) {
        onRemove(id);
      }
    }
  };
  
  const getColor = () => {
    if (isDragging) return '#22c55e'; // Green when dragging
    if (hovered) return '#6366f1'; // Purple on hover
    return color;
  };
  
  return (
    <mesh 
      ref={meshRef}
      position={position} 
      castShadow 
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => { setHovered(false); setIsDragging(false); onDragEnd?.(); }}
    >
      <boxGeometry args={[postSize, height, postSize]} />
      <meshStandardMaterial 
        color={getColor()} 
        metalness={0.6} 
        roughness={0.4}
        emissive={isDragging ? '#22c55e' : (hovered ? '#6366f1' : '#000000')}
        emissiveIntensity={isDragging || hovered ? 0.3 : 0}
      />
    </mesh>
  );
}
