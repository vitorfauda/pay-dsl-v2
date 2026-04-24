import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars, Torus } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import type { Mesh } from 'three';

function OrbitingTorus({ radius, speed, color, thickness = 0.02 }: { radius: number; speed: number; color: string; thickness?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * speed;
      ref.current.rotation.y += dt * speed * 0.7;
    }
  });
  return (
    <Torus ref={ref} args={[radius, thickness, 16, 100]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.9} roughness={0.2} />
    </Torus>
  );
}

function CoreSphere() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.2, 64, 64]}>
        <MeshDistortMaterial
          color="#22c55e"
          distort={0.35}
          speed={1.8}
          roughness={0.15}
          metalness={0.95}
          emissive="#10b981"
          emissiveIntensity={0.3}
        />
      </Sphere>
    </Float>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={['#05070d', 6, 18]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[6, 6, 6]} color="#22c55e" intensity={3} />
          <pointLight position={[-6, -3, 4]} color="#22d3ee" intensity={2} />
          <pointLight position={[0, 4, -4]} color="#d946ef" intensity={1.2} />

          <Stars radius={60} depth={40} count={1500} factor={3} fade speed={0.6} />

          <CoreSphere />

          <OrbitingTorus radius={2.2} speed={0.4} color="#22c55e" />
          <OrbitingTorus radius={2.6} speed={-0.3} color="#22d3ee" />
          <OrbitingTorus radius={3.0} speed={0.2} color="#d946ef" thickness={0.015} />
        </Suspense>
      </Canvas>
    </div>
  );
}
