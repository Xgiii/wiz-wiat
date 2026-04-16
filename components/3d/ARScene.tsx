'use client';

import { useRef, useState, useCallback, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore, useXRHitTest, XROrigin, XRDomOverlay, IfInSessionMode } from '@react-three/xr';
import { useCarportStore } from '@/store/carportStore';
import Carport from './Carport';
import * as THREE from 'three';

// ─── Global error log visible on screen ─────────────────────────────────────
const errorLog: string[] = [];
function logError(msg: string) {
  console.error('[AR]', msg);
  errorLog.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  // Trigger re-render of error display via custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ar-error'));
  }
}

// ─── Polyfill: strip entityTypes (unsupported by some WebXR polyfills) ──────
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'xr' in navigator) {
  try {
    const originalRequestSession = (navigator as any).xr.requestSession;
    if (originalRequestSession) {
      (navigator as any).xr.requestSession = async function(this: any, ...args: any[]) {
        try {
          const session = await originalRequestSession.apply(this, args);
          if (session && session.requestHitTestSource) {
            const orig = session.requestHitTestSource.bind(session);
            session.requestHitTestSource = function(options: any) {
              if (options && options.entityTypes) {
                delete options.entityTypes;
              }
              return orig(options);
            };
          }
          return session;
        } catch (e: any) {
          logError('requestSession inner error: ' + e.message);
          throw e;
        }
      };
    }
  } catch (e: any) {
    logError('Polyfill setup error: ' + e.message);
  }
}

// ─── XR Store — hit-test optional to support more devices ───────────────────
let xrStore: ReturnType<typeof createXRStore>;
try {
  xrStore = createXRStore({
    offerSession: false,
    hitTest: true,        // true = optional (was 'required')
    domOverlay: true,
    hand: false,          // disable hand tracking (not needed, reduces errors)
    controller: false,    // disable controllers 
    gaze: false,
    screenInput: true,    // keep touch/screen input
    emulate: false,       // disable built-in emulator to avoid conflicts with extension
  });
} catch (e: any) {
  logError('createXRStore error: ' + e.message);
  // Create minimal fallback store
  xrStore = createXRStore({ offerSession: false, emulate: false });
}

const matrixHelper = new THREE.Matrix4();
const hitPosition = new THREE.Vector3();

// ─── Error Boundary for Three.js/R3F errors ─────────────────────────────────
class ARErrorBoundary extends Component<{ children: ReactNode; onError: (msg: string) => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(`React error: ${error.message} | ${info.componentStack?.slice(0, 200)}`);
    this.props.onError(error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Hit Test Reticle ───────────────────────────────────────────────────────
function HitTestReticle({ onPlace }: { onPlace: (position: THREE.Vector3) => void }) {
  const reticleRef = useRef<THREE.Group>(null);
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const hasHit = useRef(false);

  try {
    useXRHitTest((results, getWorldMatrix) => {
      try {
        if (results.length === 0 || !reticleRef.current) return;
        getWorldMatrix(matrixHelper, results[0]);
        hitPosition.setFromMatrixPosition(matrixHelper);
        reticleRef.current.visible = true;
        reticleRef.current.position.copy(hitPosition);
        currentPos.current.copy(hitPosition);
        hasHit.current = true;
      } catch (e: any) {
        logError('Hit test callback: ' + e.message);
      }
    }, 'viewer');
  } catch (e: any) {
    logError('useXRHitTest setup: ' + e.message);
  }

  return (
    <group ref={reticleRef} visible={false}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial color="#6366f1" side={THREE.DoubleSide} opacity={0.8} transparent />
      </mesh>
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

// ─── Placed Carport ─────────────────────────────────────────────────────────
function PlacedCarport({ position }: { position: THREE.Vector3 }) {
  const config = useCarportStore((state) => state.config);
  return (
    <group position={position} scale={[0.5, 0.5, 0.5]}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <Carport config={config} selectedType={null} />
    </group>
  );
}

// ─── AR Scene Content (inside XR context) ───────────────────────────────────
function ARContent({ onExitAR, onLog }: { onExitAR: () => void; onLog: (msg: string) => void }) {
  const [placedPosition, setPlacedPosition] = useState<THREE.Vector3 | null>(null);
  const [showPlaceHint, setShowPlaceHint] = useState(true);

  const handlePlace = useCallback((position: THREE.Vector3) => {
    setPlacedPosition(position);
    setShowPlaceHint(false);
    onLog('Wiata umieszczona na pozycji: ' + position.toArray().map(v => v.toFixed(2)).join(', '));
  }, [onLog]);

  // Auto-place fallback after 6s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!placedPosition) {
        const fallback = new THREE.Vector3(0, 0, -3);
        setPlacedPosition(fallback);
        setShowPlaceHint(false);
        onLog('Auto-placement (brak hit-test po 6s)');
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [placedPosition, onLog]);

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <XROrigin />

      {!placedPosition && <HitTestReticle onPlace={handlePlace} />}
      {placedPosition && <PlacedCarport position={placedPosition} />}

      {/* DOM Overlay inside AR session */}
      <IfInSessionMode allow="immersive-ar">
        <XRDomOverlay
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 99999,
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
          }}
        >
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
            }}
          >
            ✕ Zamknij AR
          </button>
          <div style={{
            pointerEvents: 'none',
            padding: '10px 20px',
            borderRadius: '12px',
            background: showPlaceHint ? 'rgba(0,0,0,0.7)' : 'rgba(16,185,129,0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'white',
            fontSize: '0.85rem',
            textAlign: 'center',
            maxWidth: '220px',
          }}>
            {showPlaceHint ? 'Skieruj kamerę na podłogę i dotknij' : '✓ Wiata umieszczona!'}
          </div>
        </XRDomOverlay>
      </IfInSessionMode>
    </>
  );
}

// ─── On-Screen Error Log Component ──────────────────────────────────────────
function ErrorDisplay() {
  const [, forceUpdate] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('ar-error', handler);
    return () => window.removeEventListener('ar-error', handler);
  }, []);

  if (errorLog.length === 0 || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '40vh',
      overflowY: 'auto',
      zIndex: 100000,
      background: 'rgba(0,0,0,0.9)',
      color: '#ff6b6b',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: '8px',
      borderTop: '2px solid #ef4444',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <strong style={{ color: '#ff6b6b' }}>🔴 AR Error Log ({errorLog.length})</strong>
        <button
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}
        >✕</button>
      </div>
      {errorLog.map((msg, i) => (
        <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #333', wordBreak: 'break-all' }}>{msg}</div>
      ))}
    </div>
  );
}

// ─── Debug Log Component ────────────────────────────────────────────────────
function DebugLog({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: errorLog.length > 0 ? '40vh' : 0,
      left: 0,
      right: 0,
      maxHeight: '20vh',
      overflowY: 'auto',
      zIndex: 100000,
      background: 'rgba(0,0,0,0.85)',
      color: '#60a5fa',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: '8px',
      borderTop: '1px solid #3b82f6',
    }}>
      <strong style={{ color: '#60a5fa' }}>ℹ️ AR Debug</strong>
      {messages.map((msg, i) => (
        <div key={i} style={{ padding: '2px 0' }}>{msg}</div>
      ))}
    </div>
  );
}

// ─── Main ARScene Component ─────────────────────────────────────────────────
interface ARSceneProps {
  onBack: () => void;
}

export default function ARScene({ onBack }: ARSceneProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [startError, setStartError] = useState<string | null>(null);

  const addDebug = useCallback((msg: string) => {
    setDebugMessages(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleExitAR = useCallback(() => {
    try {
      const session = xrStore.getState().session;
      if (session) {
        session.end();
      }
    } catch (e: any) {
      logError('Exit AR error: ' + e.message);
    }
    setIsSessionActive(false);
    onBack();
  }, [onBack]);

  const handleStartAR = async () => {
    setStartError(null);
    addDebug('Starting AR session...');
    try {
      await xrStore.enterAR();
      setIsSessionActive(true);
      addDebug('AR session started OK');
    } catch (e: any) {
      const msg = e?.message || String(e);
      logError('enterAR failed: ' + msg);
      setStartError(msg);
      addDebug('AR start failed: ' + msg);
    }
  };

  // Listen for native session end
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

  // Global unhandled error catcher
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      logError('Unhandled: ' + event.message);
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      logError('Unhandled promise: ' + (event.reason?.message || String(event.reason)));
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a14' }}>

      {/* Start AR screen */}
      {!isSessionActive && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '24px', zIndex: 10001,
          background: 'linear-gradient(180deg, #1e1e2f 0%, #0a0a14 100%)',
        }}>
          <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))' }}>📱</div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Widok AR</h2>
          <p style={{ color: '#a0a0c0', fontSize: '0.95rem', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6, margin: 0 }}>
            Umieść swoją wiatę w rzeczywistym otoczeniu za pomocą kamery
          </p>

          {startError && (
            <div style={{
              padding: '12px 20px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)',
              color: '#fca5a5', fontSize: '0.8rem', maxWidth: '320px', textAlign: 'center',
              wordBreak: 'break-word',
            }}>
              <strong>Błąd:</strong> {startError}
            </div>
          )}

          <button onClick={handleStartAR} style={{
            padding: '16px 40px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(99, 102, 241, 0.4)',
          }}>
            🚀 Uruchom AR
          </button>
          <button onClick={onBack} style={{
            padding: '12px 32px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: '#c0c0d0', fontSize: '0.9rem', cursor: 'pointer',
          }}>
            ← Powrót do konfiguratora
          </button>
        </div>
      )}

      {/* Three.js Canvas */}
      <ARErrorBoundary onError={(msg) => logError('Boundary caught: ' + msg)}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        >
          <XR store={xrStore}>
            <ARContent onExitAR={handleExitAR} onLog={addDebug} />
          </XR>
        </Canvas>
      </ARErrorBoundary>

      {/* On-screen error & debug logs */}
      <ErrorDisplay />
      <DebugLog messages={debugMessages} />
    </div>
  );
}
