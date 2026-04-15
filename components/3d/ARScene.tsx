'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore, useXRHitTest, XROrigin } from '@react-three/xr';
import { useCarportStore } from '@/store/carportStore';
import Carport from './Carport';
import * as THREE from 'three';

const xrStore = createXRStore({
  offerSession: false,
  hitTest: 'required',
  domOverlay: true,
});

const matrixHelper = new THREE.Matrix4();
const hitPosition = new THREE.Vector3();

function HitTestReticle({ onPlace }: { onPlace: (position: THREE.Vector3) => void }) {
  const reticleRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3());

  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0 || !reticleRef.current) return;

    getWorldMatrix(matrixHelper, results[0]);
    hitPosition.setFromMatrixPosition(matrixHelper);

    reticleRef.current.visible = true;
    reticleRef.current.position.copy(hitPosition);
    currentPos.current.copy(hitPosition);
  }, 'viewer');

  return (
    <mesh
      ref={reticleRef}
      visible={false}
      rotation-x={-Math.PI / 2}
      onClick={() => {
        if (currentPos.current) {
          onPlace(currentPos.current.clone());
        }
      }}
    >
      <ringGeometry args={[0.08, 0.12, 32]} />
      <meshBasicMaterial color="#6366f1" side={THREE.DoubleSide} opacity={0.8} transparent />
    </mesh>
  );
}

function PlacedCarport({ position }: { position: THREE.Vector3 }) {
  const config = useCarportStore((state) => state.config);

  return (
    <group position={position} scale={[0.15, 0.15, 0.15]}>
      <Carport
        config={config}
        selectedType={null}
      />
    </group>
  );
}

function ARContent({ onPlaced }: { onPlaced: () => void }) {
  const [placedPosition, setPlacedPosition] = useState<THREE.Vector3 | null>(null);

  const handlePlace = useCallback((position: THREE.Vector3) => {
    setPlacedPosition(position);
    onPlaced();
  }, [onPlaced]);

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />

      <XROrigin />

      {!placedPosition && (
        <HitTestReticle onPlace={handlePlace} />
      )}

      {placedPosition && (
        <PlacedCarport position={placedPosition} />
      )}
    </>
  );
}

interface ARSceneProps {
  onBack: () => void;
}

export default function ARScene({ onBack }: ARSceneProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [placed, setPlaced] = useState(false);

  const handleStartAR = async () => {
    try {
      await xrStore.enterAR();
      setIsSessionActive(true);
    } catch (e) {
      console.error('Failed to start AR session:', e);
      alert('Nie udało się uruchomić trybu AR. Upewnij się, że Twoje urządzenie obsługuje WebXR AR.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a14' }}>
      {/* Overlay UI */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <button
          onClick={onBack}
          style={{
            pointerEvents: 'auto',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Wróć
        </button>

        {isSessionActive && !placed && (
          <div style={{
            pointerEvents: 'none',
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'white',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            Skieruj kamerę na podłogę i dotknij, aby umieścić wiatę
          </div>
        )}

        {isSessionActive && placed && (
          <div style={{
            pointerEvents: 'none',
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'white',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            ✓ Wiata umieszczona! Obejrzyj dookoła.
          </div>
        )}
      </div>

      {/* Start AR screen (shown before session is active) */}
      {!isSessionActive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          zIndex: 10001,
          background: 'linear-gradient(180deg, #1e1e2f 0%, #0a0a14 100%)',
        }}>
          <div style={{
            fontSize: '4rem',
            filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))',
            animation: 'float 3s ease-in-out infinite',
          }}>
            📱
          </div>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: 0,
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}>
            Widok AR
          </h2>
          <p style={{
            color: '#a0a0c0',
            fontSize: '0.95rem',
            textAlign: 'center',
            maxWidth: '300px',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Umieść swoją wiatę w rzeczywistym otoczeniu za pomocą kamery
          </p>
          <button
            onClick={handleStartAR}
            style={{
              padding: '16px 40px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(99, 102, 241, 0.4)';
            }}
          >
            🚀 Uruchom AR
          </button>
          <button
            onClick={onBack}
            style={{
              padding: '12px 32px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: '#c0c0d0',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            ← Powrót do konfiguratora
          </button>
        </div>
      )}

      {/* Three.js Canvas for AR */}
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          opacity: isSessionActive ? 1 : 0,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
        }}
      >
        <XR store={xrStore}>
          <ARContent onPlaced={() => setPlaced(true)} />
        </XR>
      </Canvas>
    </div>
  );
}
