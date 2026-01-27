'use client';

import { useRef, useState, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { DraggableElementType, CustomPost } from '@/types/carport';
import { useCarportStore } from '@/store/carportStore';
import { getStructuralPosts } from '@/utils/carportUtils';

interface DropZoneProps {
  selectedType: DraggableElementType | null;
  onElementPlaced: () => void;
  carportWidth: number;
  carportDepth: number;
  carportHeight: number;
}

export default function DropZone({ selectedType, onElementPlaced, carportWidth, carportDepth, carportHeight }: DropZoneProps) {
  const { addCustomPost, addCustomPanel, config } = useCarportStore();
  const [previewPos, setPreviewPos] = useState<[number, number, number] | null>(null);
  const [nearestPosts, setNearestPosts] = useState<[CustomPost, CustomPost] | null>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  
  const halfWidth = carportWidth / 2;
  const halfDepth = carportDepth / 2;
  
  // Snap to 0.5m grid
  const snapToGrid = (value: number, gridSize: number = 0.5): number => {
    return Math.round(value / gridSize) * gridSize;
  };
  
  // Check if position is within carport bounds
  const isWithinBounds = (x: number, z: number): boolean => {
    return Math.abs(x) <= halfWidth && Math.abs(z) <= halfDepth;
  };
  
  // Constrain to carport perimeter (edges only)
  const constrainToPerimeter = (x: number, z: number): { x: number; z: number } => {
    const distToLeft = Math.abs(x - (-halfWidth));
    const distToRight = Math.abs(x - halfWidth);
    const distToFront = Math.abs(z - halfDepth);
    const distToBack = Math.abs(z - (-halfDepth));
    
    const minDist = Math.min(distToLeft, distToRight, distToFront, distToBack);
    
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
  
  // Find nearest pair of posts for panel placement
  const findNearestPostPair = (x: number, z: number): [CustomPost, CustomPost] | null => {
    // Combine custom posts and structural posts
    const structuralPosts = getStructuralPosts(config);
    const allPosts = [...config.customPosts, ...structuralPosts];
    
    if (allPosts.length < 2) return null;
    
    // Sort posts by distance to click point
    const sortedPosts = allPosts.sort((a, b) => {
      const distA = Math.sqrt((a.x - x) ** 2 + (a.z - z) ** 2);
      const distB = Math.sqrt((b.x - x) ** 2 + (b.z - z) ** 2);
      return distA - distB;
    });
    
    // Return two nearest posts if they're close enough
    // Allow connecting posts even if far apart
    const post1 = sortedPosts[0];
    const post2 = sortedPosts[1];
    
    const distBetween = Math.sqrt((post1.x - post2.x) ** 2 + (post1.z - post2.z) ** 2);
    
    // Ignore if posts are practically in the same spot (< 0.2m)
    if (distBetween < 0.2) return null;
    
    return [post1, post2];
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!selectedType) {
      setPreviewPos(null);
      setNearestPosts(null);
      return;
    }
    
    e.stopPropagation();
    const point = e.point;
    
    if (selectedType === 'post') {
      const constrained = constrainToPerimeter(point.x, point.z);
      const snappedX = snapToGrid(constrained.x);
      const snappedZ = snapToGrid(constrained.z);
      setPreviewPos([snappedX, carportHeight / 2, snappedZ]);
      setNearestPosts(null);
    } else if (selectedType.startsWith('panel')) {
      const postPair = findNearestPostPair(point.x, point.z);
      if (postPair) {
        const [p1, p2] = postPair;
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        setPreviewPos([midX, carportHeight / 2, midZ]);
        setNearestPosts(postPair);
      } else {
        setPreviewPos(null);
        setNearestPosts(null);
      }
    }
  };

  const handlePointerLeave = () => {
    setPreviewPos(null);
    setNearestPosts(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!selectedType || !previewPos) return;
    
    e.stopPropagation();
    const [x, , z] = previewPos;
    
    if (selectedType === 'post') {
      addCustomPost(x, z);
      // Don't reset selection - allow adding multiple posts
    } else if (selectedType.startsWith('panel') && nearestPosts) {
      const [post1, post2] = nearestPosts;
      const type = selectedType === 'panel-solid' ? 'solid' : 'slats';
      addCustomPanel(post1.id, post2.id, type);
      // Don't reset selection - allow adding multiple panels
    }
    
    setPreviewPos(null);
    setNearestPosts(null);
  };
  
  // Calculate panel preview properties
  const panelPreview = useMemo(() => {
    if (!nearestPosts) return null;
    const [p1, p2] = nearestPosts;
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const width = Math.sqrt(dx * dx + dz * dz);
    const rotation = Math.atan2(dz, dx);
    return { width, rotation };
  }, [nearestPosts]);

  return (
    <group>
      {/* Invisible drop zone plane */}
      <mesh
        ref={planeRef}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        visible={true} // Must be visible for raycast to work
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Preview ghost element for POST */}
      {selectedType === 'post' && previewPos && (
        <mesh position={previewPos} raycast={() => null}>
          <boxGeometry args={[0.1, carportHeight, 0.1]} />
          <meshStandardMaterial 
            color="#22c55e" 
            transparent 
            opacity={0.6}
          />
        </mesh>
      )}
      
      {/* Preview ghost element for PANEL between posts */}
      {selectedType?.startsWith('panel') && previewPos && panelPreview && (
        <group position={previewPos} rotation={[0, panelPreview.rotation, 0]}>
          {selectedType === 'panel-solid' ? (
             <mesh raycast={() => null}>
              <boxGeometry args={[panelPreview.width - 0.1, carportHeight, 0.02]} />
              <meshStandardMaterial 
                color="#6366f1" 
                transparent 
                opacity={0.5}
              />
            </mesh>
          ) : (
            <mesh raycast={() => null}>
              <boxGeometry args={[panelPreview.width - 0.1, carportHeight, 0.05]} />
              <meshStandardMaterial 
                color="#6366f1" 
                transparent 
                opacity={0.5}
              />
            </mesh>
          )}
        </group>
      )}
      
      {/* Highlight nearest posts when placing panel */}
      {nearestPosts && nearestPosts.map((post, i) => (
        <mesh key={i} position={[post.x, carportHeight / 2, post.z]} raycast={() => null}>
          <boxGeometry args={[0.15, carportHeight + 0.1, 0.15]} />
          <meshStandardMaterial 
            color="#6366f1" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      ))}
      
      {/* Visual drop zone indicator when element is selected */}
      {selectedType && (
        <mesh 
          position={[0, 0.02, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[carportWidth, carportDepth]} />
          <meshBasicMaterial 
            color={selectedType === 'post' ? '#22c55e' : '#6366f1'} 
            transparent 
            opacity={0.1}
          />
        </mesh>
      )}
    </group>
  );
}


