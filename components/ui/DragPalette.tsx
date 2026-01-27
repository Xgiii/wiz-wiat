'use client';

import { DraggableElementType } from '@/types/carport';
import styles from './DragPalette.module.css';

interface DragPaletteProps {
  selectedType: DraggableElementType | null;
  onSelectType: (type: DraggableElementType | null) => void;
}

export default function DragPalette({ selectedType, onSelectType }: DragPaletteProps) {
  const handleClick = (type: DraggableElementType) => {
    if (selectedType === type) {
      onSelectType(null); // Deselect if clicking same type
    } else {
      onSelectType(type);
    }
  };

  return (
    <div className={styles.palette}>
      <p className={styles.instructions}>
        {selectedType 
          ? `Kliknij na scenę, aby umieścić ${selectedType === 'post' ? 'słup' : 'lamelę'}` 
          : 'Wybierz element, następnie kliknij na scenę'}
      </p>
      <div className={styles.items}>
        <button
          className={`${styles.draggableItem} ${selectedType === 'post' ? styles.selected : ''}`}
          onClick={() => handleClick('post')}
        >
          <div className={styles.itemIcon}>🪵</div>
          <span className={styles.itemLabel}>Słup</span>
        </button>
        <button
          className={`${styles.draggableItem} ${selectedType === 'panel-slats' ? styles.selected : ''}`}
          onClick={() => handleClick('panel-slats')}
        >
          <div className={styles.itemIcon}>▤</div>
          <span className={styles.itemLabel}>Lamela</span>
        </button>
        <button
          className={`${styles.draggableItem} ${selectedType === 'panel-solid' ? styles.selected : ''}`}
          onClick={() => handleClick('panel-solid')}
        >
          <div className={styles.itemIcon}>⬛</div>
          <span className={styles.itemLabel}>Pełna ściana</span>
        </button>
        <button
          className={`${styles.draggableItem} ${selectedType === 'feature-door' ? styles.selected : ''}`}
          onClick={() => handleClick('feature-door')}
        >
          <div className={styles.itemIcon}>🚪</div>
          <span className={styles.itemLabel}>Drzwi</span>
        </button>
        <button
          className={`${styles.draggableItem} ${selectedType === 'feature-window' ? styles.selected : ''}`}
          onClick={() => handleClick('feature-window')}
        >
          <div className={styles.itemIcon}>🪟</div>
          <span className={styles.itemLabel}>Okno</span>
        </button>
      </div>
      {selectedType && selectedType.startsWith('panel') && (
        <p className={styles.hint}>
          💡 Kliknij między dwoma słupami, aby połączyć je elementem.
        </p>
      )}
      {selectedType && (
        <button 
          className={styles.cancelButton}
          onClick={() => onSelectType(null)}
        >
          ✕ Anuluj wybór
        </button>
      )}
    </div>
  );
}

