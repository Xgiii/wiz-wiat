'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import ConfigPanel from '@/components/ui/ConfigPanel';
import ConfigLoader from '@/components/ui/ConfigLoader';
import { DraggableElementType } from '@/types/carport';

// Dynamic import for Three.js Scene to avoid SSR issues
const Scene = dynamic(() => import('@/components/3d/Scene'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Ładowanie wizualizacji 3D...</p>
    </div>
  ),
});

// Dynamic import for AR Scene
const ARScene = dynamic(() => import('@/components/3d/ARScene'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Ładowanie trybu AR...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedType, setSelectedType] = useState<DraggableElementType | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    // Check WebXR AR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      (navigator as any).xr?.isSessionSupported?.('immersive-ar')
        .then((supported: boolean) => setArSupported(supported))
        .catch(() => setArSupported(false));
    }
  }, []);

  if (showAR) {
    return <ARScene onBack={() => setShowAR(false)} />;
  }

  return (
    <div className={styles.container}>
      <ConfigLoader />
      <ConfigPanel 
        selectedType={selectedType} 
        onSelectType={setSelectedType}
        arSupported={arSupported}
        onOpenAR={() => setShowAR(true)}
      />
      <main className={styles.viewport}>
        <Scene 
          selectedType={selectedType} 
          onElementPlaced={() => setSelectedType(null)}
          onClearSelection={() => setSelectedType(null)}
        />
        
        {/* Floating AR Button (mobile-visible) */}
        {arSupported && (
          <button 
            className={styles.floatingArButton}
            onClick={() => setShowAR(true)}
            title="Zobacz w AR"
          >
            <span className={styles.arIcon}>📱</span>
            <span className={styles.arLabel}>AR</span>
          </button>
        )}
      </main>
    </div>
  );
}
