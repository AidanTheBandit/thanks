import React, { useRef, useMemo, useEffect, useState, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CSG } from 'three-csg-ts';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { shaderMaterial } from '@react-three/drei';
import { vertexShader, fragmentShader } from './bloomShader';

const BloomMaterial = shaderMaterial(
  { score: 0.5, time: 0 },
  vertexShader,
  fragmentShader
);

const GratitudeBloom = forwardRef(({ score, text }, ref) => {
  const [font, setFont] = useState(null);
  const particlesRef = useRef();

  useEffect(() => {
    const fontLoader = new FontLoader();
    fontLoader.load('/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
      setFont(loadedFont);
    });
  }, []);

  useFrame((state, delta) => {
    if (ref && ref.current) {
      ref.current.rotation.y += delta * 0.2;
      ref.current.rotation.x += delta * 0.1;
      if (ref.current.material.uniforms) {
        ref.current.material.uniforms.time.value += delta;
      }
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
    }
  });

  const { geometry, material, particles } = useMemo(() => {
    if (!font) return { geometry: new THREE.BufferGeometry(), material: new THREE.MeshStandardMaterial(), particles: null };

    // Bloom Geometry
    const shape = new THREE.Shape();
    const petals = Math.floor(THREE.MathUtils.lerp(4, 16, score));
    const bloom = THREE.MathUtils.lerp(1.5, 3.5, score);
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const x = Math.cos(angle) * bloom;
      const y = Math.sin(angle) * bloom;
      shape.moveTo(0, 0);
      shape.absarc(x, y, 1.2, angle - Math.PI / (petals * 1.5), angle + Math.PI / (petals * 1.5), false);
    }
    const extrudeSettings = {
      steps: 2,
      depth: 0.3 + score * 0.3,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 1,
    };
    const bloomGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const bloomMesh = new THREE.Mesh(bloomGeom);

    // Text Geometry
    const textGeom = new TextGeometry(text, {
      font: font,
      size: 0.5,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 5,
    });
    textGeom.center();
    const textMesh = new THREE.Mesh(textGeom);
    textMesh.position.z = 0.3;

    // CSG Operation
    const finalGeom = CSG.toGeometry(CSG.fromMesh(bloomMesh).union(CSG.fromMesh(textMesh)));

    // Gratitude Ladder Materials & Effects
    let mat;
    let parts = null;

    if (score < 0.4) { // Tier 1
      mat = new THREE.MeshStandardMaterial({ color: '#7f8c8d' });
    } else if (score < 0.7) { // Tier 2
      mat = new THREE.MeshStandardMaterial({ color: '#3498db', metalness: 0.6, roughness: 0.3 });
    } else if (score < 0.9) { // Tier 3
      mat = new BloomMaterial({ score });
    } else { // Tier 4
      mat = new BloomMaterial({ score });
      const particleCount = 700;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 12;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      parts = (
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial size={0.06} color="#f1c40f" blending={THREE.AdditiveBlending} transparent />
        </points>
      );
    }

    return { geometry: finalGeom, material: mat, particles: parts };
  }, [score, text, font]);

  return (
    <>
      <mesh ref={ref} geometry={geometry} material={material} />
      {particles}
    </>
  );
});

export default GratitudeBloom;
