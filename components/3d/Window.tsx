'use client';

interface WindowProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}

export default function Window({ position, rotation = [0, 0, 0], color }: WindowProps) {
  const windowWidth = 0.8;
  const windowHeight = 0.4;
  const frameThickness = 0.04;
  const wallThickness = 0.05;
  const offset = wallThickness / 2 + 0.005; // Slightly outside the wall

  return (
    <group position={position} rotation={rotation}>
      {/* Simulation of hole - black box inside wall */}
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[windowWidth - 0.02, windowHeight - 0.02, wallThickness + 0.002]} />
         <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Glass (Front and Back) */}
      <mesh position={[0, 0, wallThickness/2 + 0.001]}>
        <boxGeometry args={[windowWidth - frameThickness * 2, windowHeight - frameThickness * 2, 0.002]} />
        <meshPhysicalMaterial
          color="#88ccff"
          metalness={0.1}
          roughness={0.1}
          transmission={0.6} // Glass-like
          thickness={0.5}
        />
      </mesh>
      <mesh position={[0, 0, -(wallThickness/2 + 0.001)]}>
        <boxGeometry args={[windowWidth - frameThickness * 2, windowHeight - frameThickness * 2, 0.002]} />
        <meshPhysicalMaterial
          color="#88ccff"
          metalness={0.1}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>

      {/* Frame - Front Side */}
      <group position={[0, 0, offset]}>
        {/* Top */}
        <mesh position={[0, windowHeight / 2 - frameThickness / 2, 0]} castShadow>
          <boxGeometry args={[windowWidth, frameThickness, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Bottom */}
        <mesh position={[0, -windowHeight / 2 + frameThickness / 2, 0]} castShadow>
          <boxGeometry args={[windowWidth, frameThickness, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Left */}
        <mesh position={[-windowWidth / 2 + frameThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[frameThickness, windowHeight, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Right */}
        <mesh position={[windowWidth / 2 - frameThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[frameThickness, windowHeight, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* Frame - Back Side */}
      <group position={[0, 0, -offset]}>
        {/* Top */}
        <mesh position={[0, windowHeight / 2 - frameThickness / 2, 0]} castShadow>
          <boxGeometry args={[windowWidth, frameThickness, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Bottom */}
        <mesh position={[0, -windowHeight / 2 + frameThickness / 2, 0]} castShadow>
          <boxGeometry args={[windowWidth, frameThickness, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Left */}
        <mesh position={[-windowWidth / 2 + frameThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[frameThickness, windowHeight, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Right */}
        <mesh position={[windowWidth / 2 - frameThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[frameThickness, windowHeight, 0.02]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
