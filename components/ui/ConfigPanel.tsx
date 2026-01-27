'use client';

import { useState } from 'react';
import { useCarportStore } from '@/store/carportStore';
import { AVAILABLE_COLORS, DraggableElementType, PanelType, RoofType } from '@/types/carport';
import { generateShareUrl, copyToClipboard } from '@/utils/configSharing';
import styles from './ConfigPanel.module.css';
import DragPalette from './DragPalette';

interface ConfigPanelProps {
  selectedType: DraggableElementType | null;
  onSelectType: (type: DraggableElementType | null) => void;
}

export default function ConfigPanel({ selectedType, onSelectType }: ConfigPanelProps) {
  const { 
    config, 
    setWidth, 
    setDepth, 
    setHeight, 
    setColor, 
    setRoofType, 
    setPanel,
    setStorageRoom,
    setGutter,
    removeCustomPost,
    removeCustomPanel,
    resetConfig
  } = useCarportStore();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleShare = async () => {
    const url = generateShareUrl(config);
    const success = await copyToClipboard(url);
    if (success) {
      showToast('Link skopiowany do schowka!');
    } else {
      showToast('Nie udało się skopiować linku', 'error');
    }
  };

  const handleReset = () => {
    if (confirm('Czy na pewno chcesz zresetować konfigurację do ustawień domyślnych?')) {
      resetConfig();
      showToast('Konfiguracja została zresetowana');
    }
  };

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>
        <span className={styles.titleIcon}>🏗️</span>
        Konfigurator Wiaty
      </h1>

      {/* Dimensions Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📐 Wymiary</h2>
        
        <div className={styles.field}>
          <label className={styles.label}>
            Głębokość: <span className={styles.value}>{config.width.toFixed(1)}m</span>
          </label>
          <input
            type="range"
            min="3"
            max="8"
            step="0.5"
            value={config.width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Szerokość: <span className={styles.value}>{config.depth.toFixed(1)}m</span>
          </label>
          <input
            type="range"
            min="4"
            max="8"
            step="0.5"
            value={config.depth}
            onChange={(e) => setDepth(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Wysokość: <span className={styles.value}>{config.height.toFixed(1)}m</span>
          </label>
          <input
            type="range"
            min="2.2"
            max="3.5"
            step="0.1"
            value={config.height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>
      </section>

      {/* Color Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎨 Kolor konstrukcji</h2>
        <div className={styles.colorGrid}>
          {AVAILABLE_COLORS.map((c) => (
            <button
              key={c.hex}
              className={`${styles.colorButton} ${config.color === c.hex ? styles.colorButtonActive : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => setColor(c.hex)}
              title={`${c.name} (RAL ${c.ral})`}
            >
              {config.color === c.hex && <span className={styles.checkmark}>✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Roof Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏠 Typ dachu</h2>
        <div className={styles.buttonGroup}>
          {(['metal', 'glass', 'polycarbonate'] as RoofType[]).map((type) => (
            <button
              key={type}
              className={`${styles.optionButton} ${config.roofType === type ? styles.optionButtonActive : ''}`}
              onClick={() => setRoofType(type)}
            >
              {type === 'metal' && '🔩 Blacha'}
              {type === 'glass' && '🪟 Szkło'}
              {type === 'polycarbonate' && '💠 Poliwęglan'}
            </button>
          ))}
        </div>
      </section>

      {/* Drag & Drop Elements Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🪵 Dodaj elementy</h2>
        <DragPalette 
          selectedType={selectedType}
          onSelectType={onSelectType}
        />
        
        {/* Show custom elements count */}
        {(config.customPosts.length > 0 || config.customPanels.length > 0) && (
          <div className={styles.customElementsInfo}>
            {config.customPosts.length > 0 && (
              <div className={styles.elementCount}>
                Słupy: {config.customPosts.length}
                <button 
                  className={styles.clearButton}
                  onClick={() => config.customPosts.forEach(p => removeCustomPost(p.id))}
                >
                  Usuń wszystkie
                </button>
              </div>
            )}
            {config.customPanels.length > 0 && (
              <div className={styles.elementCount}>
                Lamele: {config.customPanels.length}
                <button 
                  className={styles.clearButton}
                  onClick={() => config.customPanels.forEach(p => removeCustomPanel(p.id))}
                >
                  Usuń wszystkie
                </button>
              </div>
            )}
          </div>
        )}
      </section>



      {/* Storage Room Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏪 Pomieszczenie gospodarcze</h2>
        
        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={config.storageRoom.enabled}
              onChange={(e) => setStorageRoom({ 
                ...config.storageRoom, 
                enabled: e.target.checked 
              })}
              className={styles.checkbox}
            />
            Dodaj pomieszczenie
          </label>
        </div>

        {config.storageRoom.enabled && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>
                Położenie:
              </label>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.optionButton} ${config.storageRoom.position === 'left' ? styles.optionButtonActive : ''}`}
                  onClick={() => setStorageRoom({ ...config.storageRoom, position: 'left' })}
                >
                  Lewa
                </button>
                <button
                  className={`${styles.optionButton} ${config.storageRoom.position === 'back' ? styles.optionButtonActive : ''}`}
                  onClick={() => setStorageRoom({ ...config.storageRoom, position: 'back' })}
                >
                  Tył
                </button>
                <button
                  className={`${styles.optionButton} ${config.storageRoom.position === 'right' ? styles.optionButtonActive : ''}`}
                  onClick={() => setStorageRoom({ ...config.storageRoom, position: 'right' })}
                >
                  Prawa
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Rozmiar: <span className={styles.value}>{config.storageRoom.depth.toFixed(1)}m</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={config.storageRoom.depth}
                onChange={(e) => setStorageRoom({ 
                  ...config.storageRoom, 
                  depth: parseFloat(e.target.value) 
                })}
                className={styles.slider}
              />
            </div>
          </>
        )}
      </section>

      {/* Gutter Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Rynna</h3>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={config.gutter?.enabled || false}
              onChange={(e) => setGutter({ 
                enabled: e.target.checked, 
                side: config.gutter?.side || 'front', 
                drain: config.gutter?.drain || 'right' 
              })}
            />
            <span className={styles.switchSlider}></span>
          </label>
        </div>

        {config.gutter?.enabled && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>
                Strona montażu:
              </label>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.optionButton} ${config.gutter.side === 'front' ? styles.optionButtonActive : ''}`}
                  onClick={() => setGutter({ ...config.gutter, side: 'front' })}
                >
                  Przód (Prawa)
                </button>
                <button
                  className={`${styles.optionButton} ${config.gutter.side === 'back' ? styles.optionButtonActive : ''}`}
                  onClick={() => setGutter({ ...config.gutter, side: 'back' })}
                >
                  Tył (Lewa)
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Spust rynny:
              </label>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.optionButton} ${config.gutter.drain === 'left' ? styles.optionButtonActive : ''}`}
                  onClick={() => setGutter({ ...config.gutter, drain: 'left' })}
                >
                  Lewa
                </button>
                <button
                  className={`${styles.optionButton} ${config.gutter.drain === 'right' ? styles.optionButtonActive : ''}`}
                  onClick={() => setGutter({ ...config.gutter, drain: 'right' })}
                >
                  Prawa
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Share & Reset Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📤 Udostępnij</h2>
        <div className={styles.shareButtons}>
          <button 
            className={styles.shareButton}
            onClick={handleShare}
          >
            🔗 Kopiuj link
          </button>
          <button 
            className={styles.resetButton}
            onClick={handleReset}
          >
            ↺ Reset
          </button>
        </div>
      </section>

      {/* Info Section */}
      <section className={styles.infoSection}>
        <p>
          Obracaj widok: przeciągnij myszką<br/>
          Powiększenie: scroll<br/>
          <strong>Kliknij element na scenie, aby go usunąć</strong>
        </p>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
