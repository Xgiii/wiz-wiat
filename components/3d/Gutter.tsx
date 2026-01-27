import React from 'react';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';

type GutterProps = ThreeElements['group'] & {
  length: number;
  drainPosition: 'left' | 'right';
  color: string;
  pipeHeight: number;
};

export default function Gutter({ length, drainPosition, color, pipeHeight, ...props }: GutterProps) {
  const gutterRadius = 0.07; // 7cm radius (14cm width)
  const gutterThickness = 0.005; // 5mm
  const drainRadius = 0.04; // 8cm diameter

  return (
    <group {...props}>
      {/* Hooks (Brackets) every ~0.8m */}
      {(() => {
        const numHooks = Math.floor(length / 0.8) + 1;
        const hookSpacing = length / (numHooks > 1 ? numHooks - 1 : 1);
        
        return Array.from({ length: numHooks }).map((_, i) => (
          <mesh 
            key={i} 
            position={[-length/2 + i * hookSpacing, -gutterRadius +0.07, 0]} 
            rotation={[Math.PI, Math.PI/2, 0]}
            castShadow
          >
            {/* Curved bracket embracing gutter from below */}
            <torusGeometry args={[gutterRadius + 0.01, 0.008, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#303030" metalness={0.8} />
          </mesh>
        ));
      })()}

      {/* Channel - Half Cylinder */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, Math.PI/2]} castShadow>
        {/* Rotation: X=PI flips opening UP, Z=PI/2 aligns axis with length (X) */}
        <cylinderGeometry 
          args={[gutterRadius, gutterRadius, length, 32, 1, true, 0, Math.PI]} 
        />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* End Caps */}
      <mesh position={[-length/2, 0, 0]} rotation={[Math.PI, Math.PI/2, 0]}>
         <circleGeometry args={[gutterRadius, 32, 0, Math.PI]} />
         <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[length/2, 0, 0]} rotation={[Math.PI, -Math.PI/2, 0]}>
         <circleGeometry args={[gutterRadius, 32, 0, Math.PI]} />
         <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Drain System - Straight down along back post */}
      {(() => {
        const offset = 0.15; // Closer to the edge (near post)
        const xPos = drainPosition === 'left' 
          ? -length / 2 + offset 
          : length / 2 - offset;
        
        return (
          <group position={[xPos, -gutterRadius, 0]}>
            {/* 1. Funnel connection at top */}
            <mesh position={[0, -0.05, 0]}>
             <cylinderGeometry args={[drainRadius * 1.1, drainRadius * 0.9, 0.1, 16]} />
             <meshStandardMaterial color={color} />
            </mesh>
            
            {/* 2. Vertical Pipe straight down along post */}
            <mesh position={[0, -pipeHeight/2 - 0.1, 0]}> 
               <cylinderGeometry args={[drainRadius, drainRadius, pipeHeight, 16]} />
               <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Pipe mounts/clamps */}
            <mesh position={[0, -0.6, 0]} rotation={[Math.PI/2, 0, 0]}>
               <torusGeometry args={[drainRadius + 0.01, 0.008, 8, 16]} />
               <meshStandardMaterial color="#303030" />
            </mesh>
            <mesh position={[0, -pipeHeight * 0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
               <torusGeometry args={[drainRadius + 0.01, 0.008, 8, 16]} />
               <meshStandardMaterial color="#303030" />
            </mesh>
            <mesh position={[0, -pipeHeight + 0.4, 0]} rotation={[Math.PI/2, 0, 0]}>
               <torusGeometry args={[drainRadius + 0.01, 0.008, 8, 16]} />
               <meshStandardMaterial color="#303030" />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}
