'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore, useXRHitTest, XROrigin, XRDomOverlay, useXR, IfInSessionMode } from '@react-three/xr';
import { useCarportStore } from '@/store/carportStore';
import Carport from './Carport';
import * as THREE from 'three';

// Polyfill/Patch: WebXR API Emulator doesn't support entityTypes option
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'xr' in navigator) {
  const originalRequestSession = (navigator as any).xr.requestSession;
  if (originalRequestSession) {
    (navigator as any).xr.requestSession = async function(this: any, ...args: any[]) {
      const session = await originalRequestSession.apply(this, args);
      if (session && session.requestHitTestSource) {
        const originalRequestHitTestSource = session.requestHitTestSource.bind(session);
        session.requestHitTestSource = function(options: any) {
          if (options && options.entityTypes) {
            delete options.entityTypes;
          }
          return originalRequestHitTestSource(options);
        };
      }
      return session;
    };
  }
}

const xrStore = createXRStore({
  offerSession: false,
  hitTest: 'required',
  domOverlay: true,
});

const matrixHelper = new THREE.Matrix4();
const hitPosition = new THREE.Vector3();

function HitTestReticle({ onPlace }: { onPlace: (position: THREE.Vector3) => void }) {
  const reticleRef = useRef<THREE.Group>(null);
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const hasHit = useRef(false);

  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0 || !reticleRef.current) return;

    getWorldMatrix(matrixHelper, results[0]);
    hitPosition.setFromMatrixPosition(matrixHelper);

    reticleRef.current.visible = true;
    reticleRef.current.position.copy(hitPosition);
    currentPos.current.copy(hitPosition);
    hasHit.current = true;
  }, 'viewer');

  return (
    <group ref={reticleRef} visible={false}>
      {/* Reticle ring on the ground */}
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial color="#6366f1" side={THREE.DoubleSide} opacity={0.8} transparent />
      </mesh>
      {/* Larger invisible hitbox for easier tapping */}
      <mesh
        rotation-x={-Math.PI / 2}
        onClick={() => {
          if (hasHit.current) {
            onPlace(currentPos.current.clone());
          }
        }}
      >
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function PlacedCarport({ position }: { position: THREE.Vector3 }) {
  const config = useCarportStore((state) => state.config);

  return (
    <group position={position} scale={[0.5, 0.5, 0.5]}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <Carport
        config={config}
        selectedType={null}
      />
    </group>
  );
}

function ARContent({ onPlaced, onExitAR }: { onPlaced: () => void; onExitAR: () => void }) {
  const [placedPosition, setPlacedPosition] = useState<THREE.Vector3 | null>(null);
  const [showPlaceHint, setShowPlaceHint] = useState(true);

  const handlePlace = useCallback((position: THREE.Vector3) => {
    setPlacedPosition(position);
    setShowPlaceHint(false);
    onPlaced();
  }, [onPlaced]);

  // Auto-place after 8s if hit-test never fires (fallback for emulators)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!placedPosition) {
        const fallback = new THREE.Vector3(0, 0, -3);
        setPlacedPosition(fallback);
        setShowPlaceHint(false);
        onPlaced();
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [placedPosition, onPlaced]);

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

      {/* DOM Overlay: visible INSIDE the AR session */}
      <IfInSessionMode allow="immersive-ar">
        <XRDomOverlay
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
          }}
        >
          {/* Exit AR button */}
          <button
            onClick={onExitAR}
            style={{
              pointerEvents: 'auto',
              padding: '12px 24px',
              borderRadius: '14px',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            ✕ Zamknij AR
          </button>

          {/* Status hint */}
          {showPlaceHint && (
            <div
              style={{
                pointerEvents: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: 'white',
                fontSize: '0.85rem',
                textAlign: 'center',
                maxWidth: '220px',
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}
            >
              Skieruj kamerę na podłogę i dotknij, aby umieścić wiatę
            </div>
          )}

          {!showPlaceHint && (
            <div
              style={{
                pointerEvents: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: 'white',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}
            >
              ✓ Wiata umieszczona!
            </div>
          )}
        </XRDomOverlay>
      </IfInSessionMode>
    </>
  );
}

interface ARSceneProps {
  onBack: () => void;
}

export default function ARScene({ onBack }: ARSceneProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handleExitAR = useCallback(() => {
    // End the WebXR session properly
    const session = xrStore.getState().session;
    if (session) {
      session.end();
    }
    setIsSessionActive(false);
    onBack();
  }, [onBack]);

  const handleStartAR = async () => {
    try {
      await xrStore.enterAR();
      setIsSessionActive(true);
    } catch (e) {
      console.error('Failed to start AR session:', e);
      alert('Nie udało się uruchomić trybu AR. Upewnij się, że Twoje urządzenie obsługuje WebXR AR.');
    }
  };

  // Listen for session end (e.g. user presses native browser exit)
  useEffect(() => {
    const checkSession = () => {
      const state = xrStore.getState();
      if (!state.session && isSessionActive) {
        setIsSessionActive(false);
        onBack();
      }
    };
    const unsubscribe = xrStore.subscribe(checkSession);
    return () => unsubscribe();
  }, [isSessionActive, onBack]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a14' }}>

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
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
        }}
      >
        <XR store={xrStore}>
          <ARContent onPlaced={() => {}} onExitAR={handleExitAR} />
        </XR>
      </Canvas>
    </div>
  );
}
