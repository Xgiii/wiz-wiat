'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useCarportStore } from '@/store/carportStore';
import { DraggableElementType } from '@/types/carport';
import Carport from './Carport';
import DropZone from './DropZone';

interface SceneContentProps {
  selectedType: DraggableElementType | null;
  onElementPlaced: () => void;
  setControlsEnabled: (enabled: boolean) => void;
  onClearSelection?: () => void;
}

function SceneContent({ selectedType, onElementPlaced, setControlsEnabled, onClearSelection }: SceneContentProps) {
  const config = useCarportStore((state) => state.config);
  
  return (
    <>
      {/* Lighting */}
      {/* Lighting */}
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#a0c4a0', 0.6]} />
      
      {/* Ground plane - light gray/beige for better contrast */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#c8c8c0" />
      </mesh>
      
      {/* Ground Grid */}
      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#9a9a90"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#808078"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
      />
      
      {/* Drop zone for click-to-place */}
      <DropZone
        selectedType={selectedType}
        onElementPlaced={onElementPlaced}
        carportWidth={config.width}
        carportDepth={config.depth}
        carportHeight={config.height}
      />
      
      {/* Carport model with drag handlers */}
      <Carport 
        config={config} 
        onDragStart={() => setControlsEnabled(false)}
        onDragEnd={() => setControlsEnabled(true)}
        selectedType={selectedType}
        onClearSelection={onClearSelection}
      />
      
      {/* Camera controls - managed by parent state */}
    </>
  );
}

interface SceneProps {
  onElementPlaced: () => void;
  selectedType: DraggableElementType | null;
  onClearSelection?: () => void;
}

export default function Scene({ onElementPlaced, selectedType, onClearSelection }: SceneProps) {
  const [controlsEnabled, setControlsEnabled] = useState(true);

  return (
    <Canvas
      shadows
      camera={{ position: [8, 6, 10], fov: 50 }}
      gl={{ 
        antialias: true,
        alpha: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
      }}
      style={{ background: 'linear-gradient(to bottom, #87CEEB, #d0e8f0)' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#87CEEB');
      }}
    >
      <Suspense fallback={null}>
        <SceneContent 
          selectedType={selectedType} 
          onElementPlaced={onElementPlaced} 
          setControlsEnabled={setControlsEnabled}
          onClearSelection={onClearSelection}
        />
        <OrbitControls
          enabled={controlsEnabled}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={25}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.1}
          target={[0, 1.5, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
