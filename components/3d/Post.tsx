'use client';

interface PostProps {
  position: [number, number, number];
  height: number;
  color: string;
}

export default function Post({ position, height, color }: PostProps) {
  const postSize = 0.1; // 100mm x 100mm post
  
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[postSize, height, postSize]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </mesh>
  );
}
