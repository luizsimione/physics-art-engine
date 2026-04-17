import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Frame, VisualizationMode } from '../types/simulation';

interface OscilloscopeProps {
  frame: Frame | null;
  mode: VisualizationMode;
}

// Particle trail renderer
function ParticleTrails({ frame, mode }: { frame: Frame | null; mode: VisualizationMode }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const frameHistoryRef = useRef<Frame[]>([]);
  const maxHistory = 100; // Keep last 100 frames for trails

  // Update frame history
  useMemo(() => {
    if (frame) {
      frameHistoryRef.current.push(frame);
      if (frameHistoryRef.current.length > maxHistory) {
        frameHistoryRef.current.shift();
      }
    }
  }, [frame]);

  useFrame(() => {
    if (!frame || frameHistoryRef.current.length === 0) return;

    const history = frameHistoryRef.current;
    const particles = frame.particles;

    if (mode === 'waveform') {
      // Waveform mode: X position over time (scrolling oscilloscope)
      const positions: number[] = [];
      const colors: number[] = [];

      particles.forEach((particle, pIdx) => {
        history.forEach((histFrame, hIdx) => {
          if (histFrame.particles[pIdx]) {
            const p = histFrame.particles[pIdx];
            const t = (hIdx / history.length) * 10 - 5; // Time axis
            const alpha = hIdx / history.length;

            positions.push(t, p.x * 5, 0);

            // Green oscilloscope glow
            const color = new THREE.Color(0x00ff00).multiplyScalar(alpha);
            colors.push(color.r, color.g, color.b);
          }
        });
      });

      if (linesRef.current) {
        const geometry = linesRef.current.geometry;
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
      }
    } else if (mode === 'multichannel') {
      // Multi-channel mode: Stacked horizontal traces
      const positions: number[] = [];
      const colors: number[] = [];

      particles.forEach((particle, pIdx) => {
        const yOffset = (pIdx - particles.length / 2) * 0.5; // Stack channels

        history.forEach((histFrame, hIdx) => {
          if (histFrame.particles[pIdx]) {
            const p = histFrame.particles[pIdx];
            const t = (hIdx / history.length) * 10 - 5;
            const alpha = hIdx / history.length;

            positions.push(t, p.x * 0.3 + yOffset, 0);

            const hue = pIdx / particles.length;
            const color = new THREE.Color().setHSL(hue, 1.0, 0.5 * alpha);
            colors.push(color.r, color.g, color.b);
          }
        });
      });

      if (linesRef.current) {
        const geometry = linesRef.current.geometry;
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
      }
    } else if (mode === 'vectorscope') {
      // Vector scope mode: X vs Y (Lissajous patterns)
      const positions: number[] = [];
      const colors: number[] = [];

      particles.forEach((particle, pIdx) => {
        history.forEach((histFrame, hIdx) => {
          if (histFrame.particles[pIdx]) {
            const p = histFrame.particles[pIdx];
            const alpha = hIdx / history.length;

            positions.push(p.x * 5, p.y * 5, 0);

            const hue = pIdx / particles.length;
            const color = new THREE.Color().setHSL(hue, 1.0, 0.5 * alpha);
            colors.push(color.r, color.g, color.b);
          }
        });
      });

      if (pointsRef.current) {
        const geometry = pointsRef.current.geometry;
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* Line traces for waveform and multichannel */}
      {(mode === 'waveform' || mode === 'multichannel') && (
        <lineSegments ref={linesRef}>
          <bufferGeometry />
          <lineBasicMaterial vertexColors transparent opacity={0.8} />
        </lineSegments>
      )}

      {/* Points for vectorscope */}
      {mode === 'vectorscope' && (
        <points ref={pointsRef}>
          <bufferGeometry />
          <pointsMaterial
            size={0.05}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </>
  );
}

// CRT grid background
function GridBackground({ mode }: { mode: VisualizationMode }) {
  return (
    <group>
      <gridHelper args={[20, 20, 0x003300, 0x002200]} rotation-x={Math.PI / 2} />
      {mode !== 'vectorscope' && (
        <gridHelper args={[20, 20, 0x003300, 0x002200]} position={[0, 0, 0]} />
      )}
    </group>
  );
}

export default function Oscilloscope({ frame, mode }: OscilloscopeProps) {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        style={{ background: '#000' }}
      >
        <color attach="background" args={['#000']} />
        
        <ambientLight intensity={0.1} />
        
        <GridBackground mode={mode} />
        <ParticleTrails frame={frame} mode={mode} />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}
