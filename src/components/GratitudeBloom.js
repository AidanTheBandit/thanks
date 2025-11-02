import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './bloomShader';

const PastelBloomMaterial = shaderMaterial(
  { score: 0.5, time: 0 },
  vertexShader,
  fragmentShader
);

const GratitudeBloom = forwardRef(({ score, text }, ref) => {
  const textRef = useRef();
  const particlesRef = useRef();

  const { geometry, material, particles } = useMemo(() => {
    const shape = new THREE.Shape();
    const petals = Math.floor(THREE.MathUtils.lerp(5, 16, score));
    const bloom = THREE.MathUtils.lerp(1.8, 4.0, score);
    const depth = THREE.MathUtils.lerp(0.2, 0.8, score);

    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const x = Math.cos(angle) * bloom;
      const y = Math.sin(angle) * bloom;
      shape.moveTo(0, 0);
      shape.absarc(x, y, 1.4, angle - Math.PI / petals, angle + Math.PI / petals, false);
    }
    const extrudeSettings = {
      steps: 2,
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 8,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    let mat;
    let parts = null;

    const hue = THREE.MathUtils.lerp(0.6, 0.95, score);
    const color = new THREE.Color().setHSL(hue, 0.7, 0.8);

    if (score < 0.7) { // Tier 1 & 2
      mat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.1,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.15,
      });
    } else if (score < 0.9) { // Tier 3
      mat = new PastelBloomMaterial({ score });
    } else { // Tier 4
      mat = new PastelBloomMaterial({ score });
      const particleCount = 800;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 15;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      parts = (
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial size={0.07} color={color} blending={THREE.AdditiveBlending} transparent opacity={0.7} />
        </points>
      );
    }

    return { geometry: geom, material: mat, particles: parts };
  }, [score]);

  useFrame((state, delta) => {
    if (ref && ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x += delta * 0.1;
      if (ref.current.material.uniforms) {
        ref.current.material.uniforms.time.value += delta;
      }
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
    }
    if (textRef.current) {
      textRef.current.position.z = 0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
  });

  return (
    <>
      <mesh ref={ref} geometry={geometry} material={material} castShadow />
      {particles}
      <Text
        ref={textRef}
        font="https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-zK4.woff"
        fontSize={0.6}
        color="#ffffff"
        position={[0, 0, 0.5]}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#333333"
      >
        {text}
      </Text>
    </>
  );
});

export default GratitudeBloom;
