'use client';

import { PanelType, PanelFeature, DraggableElementType } from '@/types/carport';
import { useRef, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import Door from './Door';
import Window from './Window';

interface PanelProps {
  id: string; // 'left', 'right', 'back'
  position: [number, number, number];
  width: number;
  height: number;
  rotation?: [number, number, number];
  panelType: PanelType;
  color: string;
  features: PanelFeature[];
  selectedType: DraggableElementType | null;
  onAddFeature: (panelId: string, type: 'window' | 'door', x: number) => void;
  onUpdateFeaturePosition: (panelId: string, featureId: string, x: number) => void;
  onRemoveFeature: (panelId: string, featureId: string) => void;
  onFeatureDragStart?: () => void;
  onFeatureDragEnd?: () => void;
  onClearSelection?: () => void;
}

export default function Panel({ 
  id,
  position, 
  width, 
  height, 
  rotation = [0, 0, 0], 
  panelType, 
  color,
  features = [],
  selectedType,
  onAddFeature,
  onUpdateFeaturePosition,
  onRemoveFeature,
  onFeatureDragStart,
  onFeatureDragEnd,
  onClearSelection
}: PanelProps) {
  const [hovered, setHovered] = useState(false);
  const [draggingFeatureId, setDraggingFeatureId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  if (panelType === 'none') return null;
  
  const slatHeight = 0.08;
  const slatGap = 0.04;
  const slatDepth = 0.02;
  const numSlats = Math.floor(height / (slatHeight + slatGap));
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    
    // Ignore click if we just finished dragging
    if (draggingFeatureId || isDraggingRef.current) {
      setDraggingFeatureId(null);
      return;
    }
    
    // Add feature if solid panel and tool selected
    if (panelType === 'solid' && selectedType && (selectedType === 'feature-window' || selectedType === 'feature-door')) {
      const point = e.point;
      // Convert world click point to local panel coordinates
      // We essentially project the point onto the panel's width axis
      
      // Vector from panel center to click
      const clickVec = new THREE.Vector3().subVectors(point, new THREE.Vector3(...position));
      // Rotate vector by negative panel rotation to get local coords
      const euler = new THREE.Euler(...rotation);
      clickVec.applyEuler(new THREE.Euler(-euler.x, -euler.y, -euler.z));
      
      const localX = Math.max(-width/2 + 0.5, Math.min(width/2 - 0.5, clickVec.x));
      
      const featureType = selectedType === 'feature-window' ? 'window' : 'door';
      onAddFeature(id, featureType, localX);
      
      // Clear selection after adding door or window
      if (onClearSelection) {
        onClearSelection();
      }
    }
  };

  const handleFeatureDragStart = (e: ThreeEvent<PointerEvent>, featureId: string) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    
    // @ts-ignore
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingFeatureId(featureId);
    onFeatureDragStart?.();
  };
  
  const handleFeatureDragEnd = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // @ts-ignore
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDraggingFeatureId(null);
    onFeatureDragEnd?.();
    
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleFeatureDragMove = (e: ThreeEvent<PointerEvent>, featureId: string) => {
    if (draggingFeatureId !== featureId) return;
    
    e.stopPropagation();
    
    // Create a virtual infinite plane representing the wall surface
    // The panel faces Z in local space, so normal is (0,0,1) rotated by panel rotation
    const euler = new THREE.Euler(...rotation);
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(euler);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      normal, 
      new THREE.Vector3(...position)
    );
    
    const target = new THREE.Vector3();
    e.ray.intersectPlane(plane, target);
    
    if (target) {
      // Convert world target point to local panel coordinates
      const clickVec = new THREE.Vector3().subVectors(target, new THREE.Vector3(...position));
      clickVec.applyEuler(new THREE.Euler(-euler.x, -euler.y, -euler.z));
      
      // localX is the position along the wall width
      const localX = Math.max(-width/2 + 0.5, Math.min(width/2 - 0.5, clickVec.x));
      onUpdateFeaturePosition(id, featureId, localX);
    }
  };

  const handleFeatureRemove = (e: ThreeEvent<MouseEvent>, featureId: string) => {
    e.stopPropagation();
    if (e.detail === 2) {
      onRemoveFeature(id, featureId);
    }
  };

  const handlePanelPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingFeatureId) {
      setHovered(true);
    }
  };
  
  // Render slats
  if (panelType === 'slats') {
    return (
      <group position={position} rotation={rotation}>
        {Array.from({ length: numSlats }).map((_, i) => {
          const yPos = -height / 2 + (i + 0.5) * (slatHeight + slatGap);
          return (
            <mesh key={i} position={[0, yPos, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, slatHeight, slatDepth]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
            </mesh>
          );
        })}
      </group>
    );
  }
  
  // Solid panel with features and horizontal grooves (siding style)
  const panelDepth = 0.05;
  const grooveHeight = 0.015;
  const grooveDepth = 0.015;
  const grooveSpacing = 0.12; // Spacing between grooves
  const numGrooves = Math.floor(height / grooveSpacing);
  
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
      {/* Base Wall */}
      <mesh 
        position={[0, 0, 0]} 
        castShadow 
        receiveShadow
        onClick={handleClick}
        onPointerMove={handlePanelPointerMove}
        onPointerUp={() => setDraggingFeatureId(null)}
        onPointerLeave={() => { setHovered(false); setDraggingFeatureId(null); }}
      >
        <boxGeometry args={[width, height, panelDepth]} />
        <meshStandardMaterial 
          color={hovered && !selectedType ? '#ef4444' : color} 
          metalness={0.5} 
          roughness={0.5} 
          emissive={hovered && !selectedType ? '#ef4444' : '#000000'}
          emissiveIntensity={hovered && !selectedType ? 0.3 : 0}
        />
      </mesh>
      
      {/* Horizontal grooves (front side) */}
      {Array.from({ length: numGrooves }).map((_, i) => {
        const yPos = -height/2 + grooveSpacing * (i + 0.5);
        return (
          <mesh 
            key={`groove-f-${i}`} 
            position={[0, yPos, panelDepth/2 - grooveDepth/2 + 0.001]}
          >
            <boxGeometry args={[width + 0.002, grooveHeight, grooveDepth]} />
            <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
          </mesh>
        );
      })}
      
      {/* Horizontal grooves (back side) */}
      {Array.from({ length: numGrooves }).map((_, i) => {
        const yPos = -height/2 + grooveSpacing * (i + 0.5);
        return (
          <mesh 
            key={`groove-b-${i}`} 
            position={[0, yPos, -panelDepth/2 + grooveDepth/2 - 0.001]}
          >
            <boxGeometry args={[width + 0.002, grooveHeight, grooveDepth]} />
            <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Features */}
      {features.map((feature) => (
        <group 
          key={feature.id} 
          position={[feature.x, 0, 0]} 
          onPointerDown={(e) => handleFeatureDragStart(e, feature.id)}
          onPointerUp={handleFeatureDragEnd}
          onPointerMove={(e) => handleFeatureDragMove(e, feature.id)}
          onClick={(e) => handleFeatureRemove(e, feature.id)}
          onPointerOver={(e) => { e.stopPropagation(); }}
          onPointerOut={(e) => { e.stopPropagation(); }}
        >
          {feature.type === 'window' && (
            <Window 
              position={[0, 0.2, 0]} 
              color={color}
            />
          )}
          {feature.type === 'door' && (
            <Door 
              position={[0, -height/2 + 1, 0]} 
              color={color}
            />
          )}
          
          <mesh position={[0, feature.type === 'door' ? -height/2 + 1 : 0.2, 0]} visible={false}>
             <boxGeometry args={[0.8, feature.type === 'door' ? 2 : 1, 0.1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
