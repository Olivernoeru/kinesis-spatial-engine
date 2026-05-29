import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber'; // INI AKUARIUMNYA!
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// KOMPONEN 1: Logika Ekstraksi 3D (Hanya bisa hidup di dalam Canvas)
function MonacoModel(props) {
  const { scene } = useGLTF('/monaco.glb');

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#00ffea"), // Cyan Cyberpunk
          wireframe: true,
          transparent: true,
          opacity: 0.3, // Efek hologram tipis
        });
      }
    });
  }, [scene]);

  return (
    <group {...props} dispose={null}>
      <primitive 
        object={scene} 
        scale={0.005} 
        position={[0, -1, 0]} 
      />
    </group>
  );
}

// KOMPONEN 2: Gerbang Integrasi React ke WebGL
export default function HologramCity(props) {
  return (
    // Memastikan Canvas menimpa layar dengan zIndex dan transparan
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        {/* Props (seperti rotasi dari tangan lu) diterusin ke model */}
        <MonacoModel {...props} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/monaco.glb');