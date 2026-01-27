'use client';

import { useRef, useState, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { CustomPost, PanelFeature, DraggableElementType } from '@/types/carport';
import * as THREE from 'three';
import Door from './Door';
import Window from './Window';

interface ConnectedPanelProps {
  id: string;
  startPost: CustomPost;
  endPost: CustomPost;
  height: number;
  color: string;
  type?: 'slats' | 'solid';
  features: PanelFeature[];
  selectedType: DraggableElementType | null;
  onRemove: (id: string) => void;
  onAddFeature: (panelId: string, type: 'window' | 'door', x: number) => void;
  onUpdateFeaturePosition: (panelId: string, featureId: string, x: number) => void;
  onRemoveFeature: (panelId: string, featureId: string) => void;
  onFeatureDragStart?: () => void;
  onFeatureDragEnd?: () => void;
  onClearSelection?: () => void;
}

export default function ConnectedPanel({ 
  id, 
  startPost, 
  endPost, 
  height, 
  color, 
  type = 'slats',
  features = [],
  selectedType,
  onRemove,
  onAddFeature,
  onUpdateFeaturePosition,
  onRemoveFeature,
  onFeatureDragStart,
  onFeatureDragEnd,
  onClearSelection
}: ConnectedPanelProps) {
  const [hovered, setHovered] = useState(false);
  const [draggingFeatureId, setDraggingFeatureId] = useState<string | null>(null);
  
  // Calculate panel properties from post positions
  const { position, width, rotation } = useMemo(() => {
    const dx = endPost.x - startPost.x;
    const dz = endPost.z - startPost.z;
    
    // Width is distance between posts
    const panelWidth = Math.sqrt(dx * dx + dz * dz);
    
    // Position is midpoint between posts
    const posX = (startPost.x + endPost.x) / 2;
    const posZ = (startPost.z + endPost.z) / 2;
    
    // Rotation to face perpendicular to the line between posts
    const rot = Math.atan2(dz, dx);
    
    return {
      position: [posX, height / 2, posZ] as [number, number, number],
      width: panelWidth,
      rotation: rot
    };
  }, [startPost, endPost, height]);
  
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

    if (e.detail === 2) {
      onRemove(id);
      return;
    }
    
    // Add feature if solid panel and tool selected
    if (type === 'solid' && selectedType && (selectedType === 'feature-window' || selectedType === 'feature-door')) {
      const point = e.point;
      // Convert world click point to local panel coordinates
      // We essentially project the point onto the panel's width axis
      
      // Vector from panel center to click
      const clickVec = new THREE.Vector3().subVectors(point, new THREE.Vector3(...position));
      // Rotate vector by negative panel rotation to get local coords
      clickVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotation);
      
      const localX = Math.max(-width/2 + 0.5, Math.min(width/2 - 0.5, clickVec.x));
      
      const featureType = selectedType === 'feature-window' ? 'window' : 'door';
      onAddFeature(id, featureType, localX);
      
      // Clear selection after adding door or window
      if (onClearSelection) {
        onClearSelection();
      }
    }
  };

  // We use a ref to track if we are currently dragging to avoid re-renders
  // and to communicate between pointer events without state lag
  const isDraggingRef = useRef(false);

  const handleFeatureDragStart = (e: ThreeEvent<PointerEvent>, featureId: string) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    
    // @ts-ignore - r3f types might not have setPointerCapture in custom event, but DOM has it
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
    
    // Small timeout to allow the click event to fire and be ignored
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };
  
  const handleFeatureDragMove = (e: ThreeEvent<PointerEvent>, featureId: string) => {
    if (draggingFeatureId !== featureId) return;
    
    e.stopPropagation();
    
    // Create a virtual infinite plane representing the wall surface
    // The panel faces Z in local space, so normal is (0,0,1) rotated by panel rotation
    const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      normal, 
      new THREE.Vector3(...position)
    );
    
    const target = new THREE.Vector3();
    e.ray.intersectPlane(plane, target);
    
    if (target) {
      // Convert world target point to local panel coordinates
      const clickVec = new THREE.Vector3().subVectors(target, new THREE.Vector3(...position));
      clickVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotation);
      
      // localX is the position along the wall width
      const localX = Math.max(-width/2 + 0.5, Math.min(width/2 - 0.5, clickVec.x));
      onUpdateFeaturePosition(id, featureId, localX);
    }
  };
  
  const handlePanelPointerMove = (e: ThreeEvent<PointerEvent>) => {
    // Only handle hover effects here, drag is handled by the feature itself now
    if (!draggingFeatureId) {
       setHovered(true);
    }
  };
  
   const handleFeatureRemove = (e: ThreeEvent<MouseEvent>, featureId: string) => {
    e.stopPropagation();
    if (e.detail === 2) {
      onRemoveFeature(id, featureId);
    }
  };

  
  return (
    <group 
      position={position} 
      rotation={[0, rotation, 0]}
    >
      {/* Base Panel */}
      <group
        onClick={handleClick}
        onPointerMove={handlePanelPointerMove}
        onPointerUp={() => setDraggingFeatureId(null)}
        onPointerLeave={() => { setHovered(false); setDraggingFeatureId(null); }}
      >
        {type === 'solid' ? (
          /* Render solid wall with horizontal grooves (siding style) */
          <>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[width - 0.1, height, 0.05]} />
              <meshStandardMaterial 
                color={hovered && !selectedType ? '#ef4444' : color} 
                metalness={0.6} 
                roughness={0.4}
                emissive={hovered && !selectedType ? '#ef4444' : '#000000'}
                emissiveIntensity={hovered && !selectedType ? 0.3 : 0}
              />
            </mesh>
            {/* Horizontal grooves (front side) */}
            {(() => {
              const grooveHeight = 0.015;
              const grooveDepth = 0.015;
              const grooveSpacing = 0.12;
              const numGrooves = Math.floor(height / grooveSpacing);
              
              // Check if color is very light (like white) - make grooves darker for contrast
              const baseColor = new THREE.Color(color);
              const isLightColor = baseColor.getHSL({ h: 0, s: 0, l: 0 }).l > 0.85;
              const grooveColor = isLightColor 
                ? new THREE.Color(color).offsetHSL(0, 0, -0.4) 
                : new THREE.Color(color).offsetHSL(0, 0, -0.15);
              
              return Array.from({ length: numGrooves }).map((_, i) => {
                const yPos = -height/2 + grooveSpacing * (i + 0.5);
                return (
                  <mesh 
                    key={`groove-f-${i}`} 
                    position={[0, yPos, 0.025 - grooveDepth/2 + 0.001]}
                  >
                    <boxGeometry args={[width - 0.098, grooveHeight, grooveDepth]} />
                    <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
                  </mesh>
                );
              });
            })()}
            {/* Horizontal grooves (back side) */}
            {(() => {
              const grooveHeight = 0.015;
              const grooveDepth = 0.015;
              const grooveSpacing = 0.12;
              const numGrooves = Math.floor(height / grooveSpacing);
              
              // Check if color is very light (like white) - make grooves darker for contrast
              const baseColor = new THREE.Color(color);
              const isLightColor = baseColor.getHSL({ h: 0, s: 0, l: 0 }).l > 0.85;
              const grooveColor = isLightColor 
                ? new THREE.Color(color).offsetHSL(0, 0, -0.4) 
                : new THREE.Color(color).offsetHSL(0, 0, -0.15);
              
              return Array.from({ length: numGrooves }).map((_, i) => {
                const yPos = -height/2 + grooveSpacing * (i + 0.5);
                return (
                  <mesh 
                    key={`groove-b-${i}`} 
                    position={[0, yPos, -0.025 + grooveDepth/2 - 0.001]}
                  >
                    <boxGeometry args={[width - 0.098, grooveHeight, grooveDepth]} />
                    <meshStandardMaterial color={grooveColor} metalness={0.3} roughness={0.8} />
                  </mesh>
                );
              });
            })()}
          </>
        ) : (
          /* Render horizontal slats (lamele) */
          Array.from({ length: numSlats }).map((_, i) => {
            const yPos = -height / 2 + (i + 0.5) * (slatHeight + slatGap);
            return (
              <mesh key={i} position={[0, yPos, 0]} castShadow receiveShadow>
                <boxGeometry args={[width - 0.1, slatHeight, slatDepth]} />
                <meshStandardMaterial 
                  color={hovered ? '#ef4444' : color} 
                  metalness={0.6} 
                  roughness={0.4}
                  emissive={hovered ? '#ef4444' : '#000000'}
                  emissiveIntensity={hovered ? 0.3 : 0}
                />
              </mesh>
            );
          })
        )}
      </group>

      {/* Features (Windows/Doors) */}
      {type === 'solid' && features.map((feature) => (
        <group 
          key={feature.id} 
          position={[feature.x, 0, 0]} // X is offset along panel width
          onPointerDown={(e) => handleFeatureDragStart(e, feature.id)}
          onPointerUp={handleFeatureDragEnd}
          onPointerMove={(e) => handleFeatureDragMove(e, feature.id)}
          onClick={(e) => handleFeatureRemove(e, feature.id)}
          onPointerOver={(e) => { e.stopPropagation(); /* Prevent panel hover */ }}
          onPointerOut={(e) => { e.stopPropagation(); /* Prevent panel hover output */ }}
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
