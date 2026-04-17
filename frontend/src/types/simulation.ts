export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

export interface Frame {
  frame: number;
  particles: Particle[];
}

export interface StreamParams {
  numParticles: number;
  steps?: number;
  seed?: number;
  fps?: number;
  dt?: number;
}

export interface StreamStatus {
  connected: boolean;
  streaming: boolean;
  frameCount: number;
  fps: number;
  error?: string;
}

export type VisualizationMode = 'waveform' | 'multichannel' | 'vectorscope';
