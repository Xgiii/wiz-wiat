'use client';

import { useState } from 'react';
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

export default function Home() {
  const [selectedType, setSelectedType] = useState<DraggableElementType | null>(null);

  return (
    <div className={styles.container}>
      <ConfigLoader />
      <ConfigPanel 
        selectedType={selectedType} 
        onSelectType={setSelectedType} 
      />
      <main className={styles.viewport}>
        <Scene 
          selectedType={selectedType} 
          onElementPlaced={() => setSelectedType(null)}
          onClearSelection={() => setSelectedType(null)}
        />
        {/* Mobile info banner */}
        <div className={styles.mobileInfo}>
          <span className={styles.mobileInfoIcon}>📱</span>
          <p>Obróć palcem, aby zobaczyć wiatę z każdej strony</p>
          <p className={styles.mobileInfoSubtext}>Konfiguracja dostępna na komputerze</p>
        </div>
      </main>
    </div>
  );
}
